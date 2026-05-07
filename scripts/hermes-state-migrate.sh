#!/usr/bin/env bash
# hermes-state-migrate.sh — Hermes Agent DB state freeze/export/restore

set -euo pipefail

HERMES_HOME="${HERMES_HOME:-$HOME/.hermes}"
SRC_DB="$HERMES_HOME/hermes.db"
BACKUP_DIR="$HERMES_HOME/backups"
TIMESTAMP=20260507_014650
DEFAULT_BACKUP_PATH="$BACKUP_DIR/hermes-state-$TIMESTAMP.db.gz"

usage() {
    cat <<'HEREDOC'
Usage: hermes-state-migrate.sh <command>

Commands:

  backup [--output <path>]
    Create a compressed backup of hermes.db (uses VACUUM INTO — safe on live DB).
    Defaults to: ~/.hermes/backups/hermes-state-YYYYMMDD_HHMMSS.db.gz

  restore <backup-file>
    Restore hermes.db from a compressed backup.
    WARNING: Replaces the current DB. Run 'backup' first if needed.

  inspect [<file>]
    Schema, FTS5 tables, record counts. No arg = live DB.

  diff <file-a> <file-b>
    Compare record counts across two backup files or live DBs.

  list
    List all compressed backups in ~/.hermes/backups/, newest first.

Environment:
  HERMES_HOME   Override Hermes home dir (default: ~/.hermes)
  SKIP_CONFIRM  Set to '1' to skip the restore confirmation prompt
HEREDOC
}

require_file() {
    if [[ ! -f "$1" ]]; then
        echo "ERROR: File not found: $1" >&2
        exit 1
    fi
}

db_stats() {
    local db_path="$1"
    local is_compressed="$2"
    local tmp

    if [[ "$is_compressed" == "yes" ]]; then
        tmp=$(mktemp)
        gunzip -c "$db_path" > "$tmp"
    else
        tmp="$db_path"
    fi

    sqlite3 "$tmp" <<'INNER_SQL'
.headers on
SELECT '=== Tables ===' as section;
SELECT name, type FROM sqlite_master WHERE type IN ('table','view','index') ORDER BY type, name;
SELECT '=== FTS5 Tables ===' as section;
SELECT name FROM sqlite_master WHERE sql LIKE '%fts5%';
SELECT '=== Record Counts ===' as section;
SELECT m.name, COUNT(t.name) as count
  FROM sqlite_master m
  LEFT JOIN pragma_table_info(m.name) t
  WHERE m.type = 'table' AND m.name NOT LIKE 'sqlite_%%'
  GROUP BY m.name;
SELECT '=== hermes_state sample ===' as section;
SELECT * FROM hermes_state LIMIT 3;
INNER_SQL

    if [[ "$is_compressed" == "yes" ]]; then
        rm -f "$tmp"
    fi
}

cmd_backup() {
    local output_path="$DEFAULT_BACKUP_PATH"

    while [[ $# -gt 0 ]]; do
        case "$1" in
            --output)
                output_path="$2"; shift 2 ;;
            *) echo "Unknown flag: $1" >&2; exit 1 ;;
        esac
    done

    mkdir -p "$(dirname "$output_path")"

    if [[ ! -f "$SRC_DB" ]]; then
        echo "ERROR: No hermes.db found at $SRC_DB — is Hermes initialized?" >&2
        exit 1
    fi

    local tmp
    tmp=$(mktemp)
    if sqlite3 "$SRC_DB" "VACUUM INTO 'file:'"$tmp"" 2>/dev/null; then
        gzip -c "$tmp" > "$output_path"
    else
        echo "WARNING: VACUUM INTO failed — falling back to copy mode"
        echo "         (do not run while Hermes is actively writing)"
        gzip -c "$SRC_DB" > "$output_path"
    fi
    rm -f "$tmp"

    local size
    size=$(du -h "$output_path" | cut -f1)
    echo "Backup created: $output_path ($size)"

    local backup_glob
    backup_glob="$(dirname "$output_path")/hermes-state-"*.db.gz
    ls -1t $backup_glob 2>/dev/null | tail -n +11 | xargs -r rm
    echo "Old backups pruned — keeping last 10"
}

cmd_restore() {
    local backup_file="$1"

    if [[ -z "$backup_file" ]]; then
        echo "ERROR: restore requires a backup file argument." >&2
        exit 1
    fi
    require_file "$backup_file"

    if [[ ! -f "$SRC_DB" ]]; then
        echo "ERROR: No hermes.db at $SRC_DB — cannot restore." >&2
        exit 1
    fi

    if [[ "${SKIP_CONFIRM:-}" != "1" ]]; then
        echo "WARNING: This will REPLACE $SRC_DB with contents of $backup_file"
        echo "Current state will be LOST unless you have a backup."
        echo ""
        read -rp "Type 'yes' to confirm: " confirm
        [[ "$confirm" == "yes" ]]
    fi

    local pids
    pids=$(pgrep -f "hermes.*agent" 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
        echo "Pausing Hermes: $pids"
        pkill -f "hermes.*agent" 2>/dev/null || true
        sleep 2
    fi

    local pre_restore="$SRC_DB.pre-restore-$TIMESTAMP.db.gz"
    gzip -c "$SRC_DB" > "$pre_restore"
    echo "Pre-restore snapshot saved: $pre_restore"

    local tmp
    tmp=$(mktemp)
    gunzip -c "$backup_file" > "$tmp"
    cp "$tmp" "$SRC_DB"
    rm -f "$tmp"
    echo "Restore complete."

    if [[ -n "$pids" ]]; then
        echo "Resuming Hermes..."
        kill -CONT $pids 2>/dev/null || true
    fi
}

cmd_inspect() {
    local target="${1:-$SRC_DB}"

    if [[ "$target" == "$SRC_DB" ]]; then
        if [[ ! -f "$SRC_DB" ]]; then
            echo "ERROR: No hermes.db at $SRC_DB" >&2
            exit 1
        fi
        echo "=== Live DB: $SRC_DB ==="
        db_stats "$SRC_DB" "no"
    else
        require_file "$target"
        echo "=== Backup: $target ==="
        db_stats "$target" "yes"
    fi
}

cmd_diff() {
    local file_a="$1"
    local file_b="$2"

    if [[ -z "$file_a" || -z "$file_b" ]]; then
        echo "ERROR: diff requires two file arguments." >&2
        exit 1
    fi
    require_file "$file_a"
    require_file "$file_b"

    echo "=== Diff: $file_a vs $file_b ==="

    local tmp_a tmp_b
    tmp_a=$(mktemp)
    tmp_b=$(mktemp)
    gunzip -c "$file_a" > "$tmp_a" 2>/dev/null || cp "$file_a" "$tmp_a"
    gunzip -c "$file_b" > "$tmp_b" 2>/dev/null || cp "$file_b" "$tmp_b"

    sqlite3 "$tmp_a" "SELECT m.name, COUNT(t.name) FROM sqlite_master m LEFT JOIN pragma_table_info(m.name) t WHERE m.type = 'table' AND m.name NOT LIKE 'sqlite_%%' GROUP BY m.name;" > "$tmp_a.counts"
    sqlite3 "$tmp_b" "SELECT m.name, COUNT(t.name) FROM sqlite_master m LEFT JOIN pragma_table_info(m.name) t WHERE m.type = 'table' AND m.name NOT LIKE 'sqlite_%%' GROUP BY m.name;" > "$tmp_b.counts"

    diff "$tmp_a.counts" "$tmp_b.counts" && echo "(no differences)" || true

    rm -f "$tmp_a" "$tmp_b" "$tmp_a.counts" "$tmp_b.counts"
}

cmd_list() {
    mkdir -p "$BACKUP_DIR"
    echo "=== Hermes State Backups (newest first) ==="
    local count=0
    for f in "$BACKUP_DIR"/hermes-state-*.db.gz; do
        [[ -f "$f" ]] || continue
        count=$((count + 1))
        local size date
        size=$(du -h "$f" | cut -f1)
        date=$(basename "$f" | sed 's/hermes-state-\(.*\)\.db\.gz/\1/' | sed 's/_/ /')
        echo "  $size  $date  $(basename "$f")"
    done
    [[ $count -eq 0 ]] && echo "  (no backups found)"
}

COMMAND="${1:-}"
shift || true

case "$COMMAND" in
    backup)    cmd_backup "$@" ;;
    restore)   cmd_restore "$@" ;;
    inspect)   cmd_inspect "$@" ;;
    diff)      cmd_diff "$@" ;;
    list)      cmd_list ;;
    -h|--help) usage ;;
    *)         usage; exit 1 ;;
esac

#!/usr/bin/env bash
#
# Verify a backup is actually restorable: restore it into a throwaway database
# and compare per-table row counts against the live source. A backup you have
# never restored is not a backup. Exits non-zero on any mismatch.
#
#   DATABASE_URL=postgres://...  ./restore-verify.sh path/to/ih_haven_XXX.dump
#
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must be set}"
DUMP="${1:?usage: restore-verify.sh <dump-file>}"
[ -f "$DUMP" ] || { echo "no such dump: $DUMP" >&2; exit 1; }

TESTDB="ih_haven_restore_verify_$$"
BASE="${DATABASE_URL%/*}"              # conn string without the db name
RESTORED="$BASE/$TESTDB"

cleanup() { dropdb --if-exists "$TESTDB" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "→ creating throwaway db $TESTDB"
createdb "$TESTDB"

echo "→ restoring $DUMP"
pg_restore --no-owner --clean --if-exists -d "$RESTORED" "$DUMP" >/dev/null 2>&1 || \
  pg_restore --no-owner -d "$RESTORED" "$DUMP" >/dev/null 2>&1

table_counts() {  # $1 = conn string  → "table|count" lines, sorted
  local conn="$1"
  psql "$conn" -At -c \
    "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename" |
  while read -r t; do
    printf '%s|%s\n' "$t" "$(psql "$conn" -At -c "SELECT count(*) FROM \"$t\"")"
  done
}

echo "→ comparing per-table row counts (source vs restored)"
SRC="$(table_counts "$DATABASE_URL")"
DST="$(table_counts "$RESTORED")"

if [ "$SRC" = "$DST" ]; then
  n=$(printf '%s\n' "$SRC" | grep -c '|')
  total=$(printf '%s\n' "$SRC" | awk -F'|' '{s+=$2} END{print s}')
  echo "✅ MATCH — $n tables, $total rows identical between source and restored"
  exit 0
else
  echo "❌ MISMATCH:"
  diff <(printf '%s\n' "$SRC") <(printf '%s\n' "$DST") || true
  exit 1
fi

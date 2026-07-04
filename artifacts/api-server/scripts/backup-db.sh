#!/usr/bin/env bash
#
# Automated logical backup of the Island Haven Postgres database.
# Produces a compressed custom-format dump (restorable with pg_restore) and
# prunes old backups. Run from cron/systemd-timer (see deploy/BACKUPS.md).
#
#   DATABASE_URL=postgres://...  BACKUP_DIR=/var/backups/ih  ./backup-db.sh
#
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must be set}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION="${BACKUP_RETENTION:-14}"   # how many dumps to keep

mkdir -p "$BACKUP_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$BACKUP_DIR/ih_haven_${STAMP}.dump"

# -Fc = custom format (compressed, selective restore); --no-owner keeps it
# portable across roles. Fails loudly (set -e) if the dump is incomplete.
pg_dump "$DATABASE_URL" -Fc --no-owner -f "$OUT"

# Prune: keep only the newest $RETENTION dumps.
ls -1t "$BACKUP_DIR"/ih_haven_*.dump 2>/dev/null | tail -n +"$((RETENTION + 1))" | xargs -r rm -f

SIZE="$(du -h "$OUT" | cut -f1)"
echo "backup ok: $OUT ($SIZE); kept newest $RETENTION in $BACKUP_DIR"

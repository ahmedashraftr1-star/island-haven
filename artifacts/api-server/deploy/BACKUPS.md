# Database backup & restore — Island Haven

Two layers: **(1) logical backups** (scripted here, tested) for day-to-day
snapshots + easy restores, and **(2) PITR** (Postgres/infra-level) for
point-in-time recovery between snapshots. Ship both for production.

---

## 1. Logical backups (scripted — verified)

Scripts in `artifacts/api-server/scripts/`:

- `backup-db.sh` — `pg_dump -Fc` (compressed custom format) + retention pruning.
- `restore-verify.sh` — restores a dump into a throwaway DB and **compares
  per-table row counts** against the live source. A backup you've never restored
  is not a backup.

### Run
```bash
DATABASE_URL=postgres://…  BACKUP_DIR=/var/backups/ih  ./scripts/backup-db.sh
DATABASE_URL=postgres://…  ./scripts/restore-verify.sh /var/backups/ih/ih_haven_XXX.dump
```

### Verified locally (2026-07-04)
```
backup ok: ih_haven_20260704T113947Z.dump (224K)
restore-verify: ✅ MATCH — 48 tables, 2706 rows identical between source and restored
```
(The verify creates `ih_haven_restore_verify_<pid>`, restores into it, diffs all
48 tables' counts, and drops it.)

### Schedule (pick one for your host)
**cron** (daily 02:30 UTC, then a weekly restore-verify):
```cron
30 2 * * *  DATABASE_URL=… BACKUP_DIR=/var/backups/ih /path/scripts/backup-db.sh >> /var/log/ih-backup.log 2>&1
15 3 * * 0  DATABASE_URL=… /path/scripts/restore-verify.sh "$(ls -t /var/backups/ih/*.dump | head -1)" >> /var/log/ih-restore-verify.log 2>&1
```
**systemd timer:** a `.service` running the script + a daily `.timer`.

> Store dumps **off the DB host** (object storage / another region). Encrypt at
> rest. Test `restore-verify.sh` on a schedule — a green cron line is the only
> proof your backups work.

---

## 2. Point-in-Time Recovery (PITR) — infrastructure-level

PITR is **not a single script** — it's a Postgres server configuration (WAL
archiving) plus a base backup. It lets you recover to *any* moment (e.g. "5 min
before the bad migration"), which logical dumps alone cannot. Activation steps:

### a) Enable WAL archiving (postgresql.conf) + restart
```conf
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /wal-archive/%f && cp %p /wal-archive/%f'   # or ship to object storage / use pgBackRest/WAL-G
max_wal_senders = 3
```

### b) Take a base backup (repeat on a schedule)
```bash
pg_basebackup -D /backups/base-$(date -u +%Y%m%dT%H%M%SZ) -Ft -z -Xs -P
```

### c) Recover to a point in time
Restore the base backup, then in `postgresql.conf` set:
```conf
restore_command = 'cp /wal-archive/%f %p'
recovery_target_time = '2026-07-04 11:39:00+00'
```
and create `recovery.signal`, then start Postgres — it replays WAL up to the target.

### Recommended
Use a managed Postgres (RDS / Cloud SQL / Neon / Supabase) that provides
**automated daily snapshots + PITR out of the box**, or run **pgBackRest** /
**WAL-G** to ship WAL + base backups to object storage. Either way, still run the
scripted logical `restore-verify.sh` on a schedule as an independent check.

> **[NEEDS-INFRA/HUMAN]** WAL archive destination, base-backup schedule, retention
> window, and off-host storage are deployment decisions (and may be a managed-DB
> setting). The scripts above are validated; PITR wiring depends on the chosen host.

#!/usr/bin/env bash
# ============================================================================
# Island Haven co-tenant PRE-FLIGHT — 100% READ-ONLY.
# Records the existing (NasToNas) site's footprint ONLY to avoid collisions,
# never to modify it. Writes a baseline snapshot for the before/after diff and
# ASSERTS that Island Haven's chosen resources are free. Aborts (non-zero) on any
# collision so you can pick different values BEFORE anything is changed.
#
# It does not create, edit, restart, or delete anything. Safe to run anytime.
# Usage:  bash 00-preflight-readonly.sh [nastonas_domain]
# ============================================================================
set -uo pipefail

IH_PORT=3020
IH_DB=ih_haven
IH_NGINX=/etc/nginx/sites-available/islandhavengsza.com
IH_USER=islandhaven
NASTONAS_DOMAIN="${1:-}"
OUT="$HOME/ih-preflight-$(date +%F-%H%M%S).baseline.txt"

log(){ printf '%s\n' "$*" | tee -a "$OUT" ; }
hr(){ log "----------------------------------------------------------------"; }

log "Island Haven co-tenant pre-flight — $(date -u) (READ-ONLY)"; hr

# --- Listening ports (find NasToNas's; confirm 3020 free) -------------------
log "## Listening TCP ports"
ss -ltnp 2>/dev/null | tee -a "$OUT" >/dev/null || sudo ss -ltnp | tee -a "$OUT" >/dev/null
PORT_TAKEN=$(ss -ltn 2>/dev/null | awk '{print $4}' | grep -E "[:.]${IH_PORT}$" || true)
hr

# --- PM2 processes (existing daemons) ---------------------------------------
log "## PM2 processes (all users we can see)"
command -v pm2 >/dev/null && pm2 list 2>/dev/null | tee -a "$OUT" >/dev/null || log "(pm2 not on PATH for this user)"
sudo -u root bash -lc 'pm2 list' 2>/dev/null | tee -a "$OUT" >/dev/null || true
hr

# --- Nginx blocks + server_names (existing) ---------------------------------
log "## Nginx: enabled sites + server_names (read-only dump)"
ls -l /etc/nginx/sites-enabled/ 2>/dev/null | tee -a "$OUT" >/dev/null
sudo nginx -T 2>/dev/null | grep -E "server_name|listen|# configuration file" | tee -a "$OUT" >/dev/null || true
sudo nginx -t 2>&1 | tee -a "$OUT" >/dev/null
NGINX_TAKEN=""; [ -e "$IH_NGINX" ] && NGINX_TAKEN=yes
hr

# --- Databases (Postgres and/or MySQL) --------------------------------------
log "## Databases present"
DB_TAKEN=""
if command -v psql >/dev/null; then
  log "### Postgres"
  sudo -u postgres psql -tAc "SELECT datname FROM pg_database WHERE datistemplate=false;" 2>/dev/null | tee -a "$OUT" >/dev/null || true
  sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${IH_DB}';" 2>/dev/null | grep -q 1 && DB_TAKEN=yes
fi
if command -v mysql >/dev/null; then
  log "### MySQL/MariaDB"; sudo mysql -e "SHOW DATABASES;" 2>/dev/null | tee -a "$OUT" >/dev/null || true
fi
hr

# --- Existing user? ---------------------------------------------------------
USER_TAKEN=""; id "$IH_USER" >/dev/null 2>&1 && USER_TAKEN=yes

# --- NasToNas live response + cert (baseline for after-diff) -----------------
if [ -n "$NASTONAS_DOMAIN" ]; then
  log "## NasToNas baseline response ($NASTONAS_DOMAIN)"
  curl -sI "https://${NASTONAS_DOMAIN}/" 2>/dev/null | tee -a "$OUT" >/dev/null || true
  log "## NasToNas cert dates"
  echo | openssl s_client -servername "$NASTONAS_DOMAIN" -connect "${NASTONAS_DOMAIN}:443" 2>/dev/null \
    | openssl x509 -noout -fingerprint -dates 2>/dev/null | tee -a "$OUT" >/dev/null || true
  hr
fi

# --- COLLISION ASSERTIONS ---------------------------------------------------
log "## Collision checks for Island Haven's resources"
FAIL=0
[ -z "$PORT_TAKEN" ]  && log "port ${IH_PORT} ............ FREE ✓" || { log "port ${IH_PORT} ............ TAKEN ✗ ($PORT_TAKEN)"; FAIL=1; }
[ -z "$DB_TAKEN" ]    && log "db ${IH_DB} ............... FREE ✓" || { log "db ${IH_DB} ............... TAKEN ✗"; FAIL=1; }
[ -z "$NGINX_TAKEN" ] && log "nginx file ............... FREE ✓" || { log "nginx file ............... TAKEN ✗ ($IH_NGINX)"; FAIL=1; }
[ -z "$USER_TAKEN" ]  && log "user ${IH_USER} ......... FREE ✓" || { log "user ${IH_USER} ......... EXISTS ✗ (reuse only if it's ours)"; FAIL=1; }
hr
log "Baseline written to: $OUT"
if [ "$FAIL" -ne 0 ]; then
  log ">>> COLLISION DETECTED — pick different values in RUNBOOK §Chosen resources BEFORE proceeding."
  exit 1
fi
log ">>> All clear. Keep this baseline file for the after-deploy diff."

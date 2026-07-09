# Island Haven — rollback (return the VPS to its exact prior state)

Every Island Haven resource is net-new, so rollback is purely *additive removal* —
NasToNas is never touched by any step below. Run top-to-bottom; each step is
independent and safe to repeat.

## 1. Nginx — remove the block, reload (never restart)
```bash
sudo rm -f /etc/nginx/sites-enabled/islandhavengsza.com
sudo rm -f /etc/nginx/sites-available/islandhavengsza.com
sudo nginx -t && sudo systemctl reload nginx    # NasToNas block validated + untouched
```

## 2. TLS cert — delete the Island Haven cert only
```bash
sudo certbot delete --cert-name islandhavengsza.com
# NasToNas's cert is a separate lineage — unaffected. Verify:
sudo certbot certificates
```

## 3. PM2 app + its dedicated daemon
```bash
sudo -u islandhaven bash -lc 'pm2 delete island-haven && pm2 save'
# remove ONLY islandhaven's boot unit (NasToNas's PM2 startup is a different unit/user):
sudo systemctl disable pm2-islandhaven 2>/dev/null || true
sudo rm -f /etc/systemd/system/pm2-islandhaven.service
sudo systemctl daemon-reload
```

## 4. Database + role (isolated — nothing shared with NasToNas)
```bash
# optional: keep a final dump first
sudo -u postgres pg_dump -Fc ih_haven > ~/ih_haven-final-$(date +%F).dump
sudo -u postgres psql -c "DROP DATABASE IF EXISTS ih_haven;"
sudo -u postgres psql -c "DROP ROLE IF EXISTS ih_haven_app;"
```

## 5. Code + user
```bash
sudo rm -rf /var/www/island-haven
sudo userdel -r islandhaven 2>/dev/null || true
```

## 6. DNS (🔑 YOU, Hostinger)
Point `A @ islandhavengsza.com` back to its previous target (`2.57.91.91`) if you
had already switched it.

## 7. Verify prior state restored
```bash
sudo nginx -t                      # green
curl -sI https://<nastonas-domain>/   # same as the pre-flight baseline
sudo certbot certificates          # only NasToNas's cert remains
ss -ltn | grep :3020 || echo "3020 free again"
```

## Nuclear option
If anything looks off, restore the **Hostinger VPS snapshot** taken in the backup
gate — it reverts the whole box to the pre-deploy state.

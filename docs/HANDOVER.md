# Production Handover & Operations Guide

---

## 1. Live Deployment Details
* **Domain**: `https://lankaproperty.lk`
* **Host**: Hostinger Cloud Web Hosting
* **Repository**: `https://github.com/abhishekdewminaa/lankaproperty-lk`
* **Branch**: `main` (Git push triggers instant Hostinger build & deployment)
* **Database**: Supabase Singapore (`rnedttrpovxswnraezas`)

---

## 2. SuperAdmin Access & Credentials
* **SuperAdmin Users**:
  * `abhishekdewminaa@gmail.com`
  * `lalith@lankaproperty.lk`
* **Dashboard Access**: Visit `https://lankaproperty.lk/admin`
* **Capabilities**:
  * Create/Publish listings with 0 limits
  * Upload unlimited high-resolution photos via Hostinger NVMe SSD pipeline
  * Review, approve, reject, or archive owner and agent submissions
  * Manage lead pipeline and viewing appointments

---

## 3. Maintenance Operations
* **Database Maintenance**: Automatically handled weekly by `09_⏰_WEEKLY_PG_CRON_AUTO_PURGE.sql` (runs `VACUUM ANALYZE` every Sunday at 03:00 UTC).
* **Storage Protection**: Automatically handled by `08_🧹_AUTO_PRUNE_SOLD_MEDIA_TRIGGER.sql` (prunes secondary photo arrays on sold listings, keeping storage negligible).
* **Local Development**:
  ```bash
  npm run dev      # Starts Express + Vite on http://localhost:3030
  npm run lint     # Runs tsc --noEmit (0 errors guaranteed)
  npm run build    # Produces production dist/ in ~1.0s
  ```

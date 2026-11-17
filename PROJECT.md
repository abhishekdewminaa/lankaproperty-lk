# LankaProperty.lk — Production Project Record

> **Authoritative Deployment Record**: Pinned project specification under the Ultrawebsite standard.

---

## 1. Production Topology & Endpoints

| Environment / Service | Target | Details |
| :--- | :--- | :--- |
| **Production Domain** | `https://lankaproperty.lk` | Hosted on **Hostinger Cloud Web Hosting** |
| **Source Control** | `github.com/abhishekdewminaa/lankaproperty-lk` | Branch: `main` (auto-deploys to Hostinger) |
| **Database Engine** | **Supabase PostgreSQL 17.6** | Project ID: `rnedttrpovxswnraezas` (Singapore / `ap-southeast-1`) |
| **Database Host** | `db.rnedttrpovxswnraezas.supabase.co` | Supavisor Pooler Port: `6543` |
| **Photo Storage** | **Hostinger 50 GB NVMe SSD** | `/uploads/properties/` — **0 MB Supabase storage used** ($0.00/mo rule) |
| **Local Dev Server** | `http://localhost:3030` | `server.ts` Express + Vite middleware |

---

## 2. SuperAdmin Governance

* **Managing Director**: Mr Lalith Ranatunga
* **SuperAdmin Accounts**:
  * `abhishekdewminaa@gmail.com`
  * `lalith@lankaproperty.lk`
* **Privileges**:
  * Complete RLS bypass via `public.is_super_admin()`.
  * Listing moderation queue (approve/reject/archive).
  * Direct property creation and publishing via `/admin/properties/new` and `/list-property`.
  * Lead Center & Viewing Appointments manager.

---

## 3. Strict Operating Rules (Non-Negotiable)

1. **Hostinger Media Offloading Rule**: NEVER upload property images to Supabase storage buckets. All images must be compressed client-side to WebP and saved directly to the Hostinger NVMe SSD (`POST /api/upload/property-image`). Only URL strings are stored in Supabase.
2. **Zero-Emoji UI Rule**: NO emojis in frontend badges, status pills, navigation labels, or production marketplace cards. Standard monochrome SVG icons (Lucide) only.
3. **InitPlan RLS Rule**: All database RLS policies must wrap user checks in `(SELECT auth.uid())` to cache evaluation per statement, avoiding per-row CPU recalculation.
4. **Statement Timeout Rule**: Supavisor authenticator and anon roles are capped at `statement_timeout = '3000'` (3.0 seconds) to prevent CPU quota exhaustion.

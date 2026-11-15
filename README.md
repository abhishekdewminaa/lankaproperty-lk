# LankaProperty.lk — Sri Lanka Architectural Property Marketplace

Sri Lanka's curated luxury real estate, residential land, new developments, and institutional property marketplace featuring:
- **Public Marketplace**: Architectural Hero Search, Featured Estates Showcase, Trending Properties (24H Velocity), 25 Districts & Cities Cadastre, New Developments & Masterplans, Wanted Property Board, and Advertising Packages & Boost Add-ons.
- **Owner & Real Estate Agent Portals**: Dedicated registration, login, property submission with client-side WebP image compression, and paid Featured/Trending slot placement.
- **SuperAdmin Executive Suite**: Complete inventory control, Featured/Trending curation, Advertising Packages & Add-ons pricing manager, and user/agent activity directory.

---

## Deploying to Hostinger from GitHub

This repository is pre-configured to work with **all 3 Hostinger deployment methods** out of the box (including Apache/LiteSpeed `.htaccess` SPA routing rules so refreshing routes like `/properties` or `/superadmin` never returns a 404).

### Method 1: Hostinger Git Auto-Deploy (Shared & Cloud Web Hosting — Recommended)
1. Log in to **Hostinger hPanel** and open **Websites → Manage** next to your domain.
2. In the left sidebar, go to **Advanced → Git**.
3. Under **Create a New Repository**:
   - **Repository**: `https://github.com/abhishekdewminaa/lankaproperty-lk.git`
   - **Branch**: `main`
   - **Install Path**: Leave blank (deploys to `public_html`).
4. Click **Create** and then click **Deploy** (or enable **Auto-Deployment** webhook to redeploy automatically whenever you push to GitHub).
   - *Note*: The root `.htaccess` and pre-built `dist/` directory are included in the repository so Hostinger Shared Hosting serves the production bundle immediately without requiring SSH build steps.

### Method 2: Hostinger Node.js / Vite Web App Hosting
If using Hostinger's **Node.js Web App** or **Static Framework preset**:
1. Connect your GitHub account and select **`abhishekdewminaa/lankaproperty-lk`**.
2. Set the build configuration:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Node Version**: `20.x` or `22.x`

### Method 3: Manual File Manager Upload
1. Run `npm run build` locally.
2. Upload the contents of the `dist/` folder (including `dist/.htaccess`) into your Hostinger `public_html/` directory.

---

## Local Development

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3030)
npm run dev

# Typecheck & build production bundle
npm run lint
npm run build
```

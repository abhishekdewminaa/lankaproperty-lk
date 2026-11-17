# Engineering Lessons Learned

---

## 1. Dynamic vs Static Column Resolution in PostgreSQL
* **Observation**: Running static `UPDATE ... SET price_lkr = COALESCE(price_lkr, price, 0)` failed with `ERROR: 42703: column "price" does not exist` when the table had already been migrated to modern column names.
* **Lesson**: PostgreSQL's query planner verifies column identifiers before executing any statement. In cross-version migrations, dynamic execution via `EXECUTE` inside `IF EXISTS (SELECT 1 FROM information_schema.columns ...)` isolates schema differences and guarantees error-free execution.

---

## 2. Hostinger Static Web Hosting & Single Page Applications (SPA)
* **Observation**: Directly navigating to `/buy`, `/property/:slug`, or `/admin` on static hosting returns 404 errors unless the web server routes all non-file requests to `index.html`.
* **Lesson**: `public/.htaccess` with `RewriteRule ^ index.html [L]` ensures smooth client-side routing on Hostinger Apache servers, while simultaneously injecting OWASP security headers and 1-year immutable caching.

---

## 3. InitPlan Caching for Row-Level Security
* **Observation**: Supabase Database Linter flags `auth.uid()` as a high-severity warning (`auth_rls_initplan`) when used directly in `USING` clauses.
* **Lesson**: Writing `(SELECT auth.uid()) = user_id` triggers PostgreSQL's InitPlan optimization, which evaluates the authentication identity exactly once per query rather than once per row.

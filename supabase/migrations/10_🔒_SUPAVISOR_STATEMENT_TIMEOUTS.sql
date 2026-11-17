-- ==============================================================================
-- 10_🔒_SUPAVISOR_STATEMENT_TIMEOUTS.sql
-- Step 10: Circuit Breaker Statement Timeouts for Authenticator and Anonymous Roles
-- Prevents runaway queries, CPU quota exhaustion, and memory spikes on Supabase Free Tier
-- ==============================================================================

-- 1. Apply a 3-second (3000ms) execution ceiling to the authenticator role (PostgREST API)
ALTER ROLE authenticator SET statement_timeout = '3000';

-- 2. Apply a 3-second ceiling to anon users (public web traffic)
ALTER ROLE anon SET statement_timeout = '3000';

-- 3. Apply a 5-second ceiling to authenticated users (logged-in dashboard actions)
ALTER ROLE authenticated SET statement_timeout = '5000';

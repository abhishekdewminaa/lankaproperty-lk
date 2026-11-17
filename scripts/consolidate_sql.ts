import * as fs from 'fs';
import * as path from 'path';

const dir = path.resolve(process.cwd(), 'supabase/migrations');
const files = [
  '01_🏗️_EXTENSIONS_AND_ENUMS.sql',
  '02_👤_USER_PROFILES_AND_ROLES.sql',
  '03_🏡_MASTER_PROPERTIES_TABLE.sql',
  '04_⚡_HIGH_SPEED_GIN_SEARCH_AND_INDEXES.sql',
  '05_📬_INQUIRIES_AND_VIEWINGS.sql',
  '06_🎯_WANTED_BUYER_DEMANDS_AND_PROPOSALS.sql',
  '07_🛡️_ZERO_COST_RLS_POLICIES.sql',
  '08_🧹_AUTO_PRUNE_SOLD_MEDIA_TRIGGER.sql',
  '09_⏰_WEEKLY_PG_CRON_AUTO_PURGE.sql',
  '10_🔒_SUPAVISOR_STATEMENT_TIMEOUTS.sql',
  '11_🌱_SEED_INITIAL_PROPERTIES.sql'
];

let consolidated = `-- ==============================================================================
-- 00_🚀_RUN_ALL_IN_ONE_CLICK.sql
-- LANKAPROPERTY.LK — COMPLETE PRODUCTION DATABASE BOOTSTRAP SCRIPT
-- Executes all 11 architectural modules in deterministic dependency order.
-- Safe, idempotent, zero-cost, high-performance Sri Lankan Real Estate Architecture.
-- ==============================================================================

`;

for (const file of files) {
  const filePath = path.join(dir, file);
  if (fs.existsSync(filePath)) {
    consolidated += `\n\n-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n`;
    consolidated += `-- MODULE: ${file}\n`;
    consolidated += `-- >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>\n\n`;
    consolidated += fs.readFileSync(filePath, 'utf8');
  }
}

const outputPath = path.join(dir, '00_🚀_RUN_ALL_IN_ONE_CLICK.sql');
fs.writeFileSync(outputPath, consolidated, 'utf8');
console.log('Successfully created 00_🚀_RUN_ALL_IN_ONE_CLICK.sql with size:', consolidated.length);

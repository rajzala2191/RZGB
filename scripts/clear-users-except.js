/**
 * Delete all auth users EXCEPT the keep list (RZ Global three + demo three).
 * Removes profile then auth user for each other user.
 *
 * Run: node scripts/clear-users-except.js
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.seed or .env
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.seed');
const fallbackEnvPath = resolve(__dirname, '../.env');
const env = {};
try {
  readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) env[key.trim()] = rest.join('=').trim();
  });
} catch {
  try {
    readFileSync(fallbackEnvPath, 'utf-8').split('\n').forEach((line) => {
      const [key, ...rest] = line.split('=');
      if (key && rest.length) env[key.trim()] = rest.join('=').trim();
    });
  } catch {
    console.error('Could not read .env.seed (or fallback .env).');
    process.exit(1);
  }
}

const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const KEEP_EMAILS = new Set([
  'supplier@rzglobalsolutions.co.uk',
  'admin@rzglobalsolutions.co.uk',
  'client@rzglobalsolutions.co.uk',
  'demo.client@vrocure.co.uk',
  'demo.admin@vrocure.co.uk',
  'demo.supplier@vrocure.co.uk',
].map((e) => e.toLowerCase()));

async function main() {
  const { data: listData, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    console.error('Failed to list users:', listError.message);
    process.exit(1);
  }

  const users = listData?.users ?? [];
  const toDelete = users.filter((u) => !KEEP_EMAILS.has((u.email || '').toLowerCase()));

  if (toDelete.length === 0) {
    console.log('No users to delete. All users are in the keep list.');
    return;
  }

  console.log(`Keeping: ${[...KEEP_EMAILS].join(', ')}`);
  console.log(`Deleting ${toDelete.length} user(s)...`);

  for (const user of toDelete) {
    const email = user.email || user.id;
    const { error: delProfile } = await admin.from('profiles').delete().eq('id', user.id);
    if (delProfile) console.warn(`  Profile warning for ${email}: ${delProfile.message}`);
    const { error: delAuth } = await admin.auth.admin.deleteUser(user.id);
    if (delAuth) {
      console.error(`  ✗ ${email}: ${delAuth.message}`);
    } else {
      console.log(`  ✓ ${email}`);
    }
  }

  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

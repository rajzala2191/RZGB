/**
 * Delete all users who signed in via Google OAuth (auth + profile).
 * Use to clear test Google users so you can re-test the joinlist/OAuth flow.
 *
 * Run once:
 *   node scripts/delete-google-auth-users.js
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

async function main() {
  const { data: listData, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    console.error('Failed to list users:', listError.message);
    process.exit(1);
  }

  const users = listData?.users ?? [];
  const googleUsers = users.filter((u) => {
    const provider = u.app_metadata?.provider ?? u.identities?.[0]?.provider;
    return provider === 'google';
  });

  if (googleUsers.length === 0) {
    console.log('No Google auth users found.');
    return;
  }

  console.log(`Found ${googleUsers.length} Google auth user(s). Deleting...`);

  for (const user of googleUsers) {
    const { error: delProfile } = await admin.from('profiles').delete().eq('id', user.id);
    if (delProfile) console.warn(`  Profile delete warning for ${user.email}: ${delProfile.message}`);
    const { error: delAuth } = await admin.auth.admin.deleteUser(user.id);
    if (delAuth) {
      console.error(`  ✗ ${user.email}: ${delAuth.message}`);
    } else {
      console.log(`  ✓ ${user.email}`);
    }
  }

  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

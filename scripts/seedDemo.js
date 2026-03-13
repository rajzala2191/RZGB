/**
 * RZGB — Demo + Super Admin Seed Script
 * ─────────────────────────────────────
 * Creates 3 demo users (client, admin, supplier) and 1 super admin,
 * then seeds demo orders in the database.
 *
 * Run once:
 *   node scripts/seedDemo.js
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.seed
 * (falls back to .env for backward compatibility)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// ── Load seed env manually (no dotenv dependency needed) ──────────────────────
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

const SUPABASE_URL         = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.seed');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── User definitions ──────────────────────────────────────────────────────────
// ⚠ Change SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD before running.
const SUPER_ADMIN_EMAIL    = 'admin@zaproc.co.uk';
const SUPER_ADMIN_PASSWORD = 'RZAdmin2024!';

const USERS = [
  {
    email:    'demo.client@zaproc.co.uk',
    password: 'RZDemo2024!',
    role:     'client',
    is_demo:  true,
    company:  'Thornton Precision Ltd',
    name:     'James Thornton (Demo)',
  },
  {
    email:    'demo.admin@zaproc.co.uk',
    password: 'RZDemo2024!',
    role:     'admin',
    is_demo:  true,
    company:  'RZ Global Solutions',
    name:     'Alex Morgan (Demo)',
  },
  {
    email:    'demo.supplier@zaproc.co.uk',
    password: 'RZDemo2024!',
    role:     'supplier',
    is_demo:  true,
    company:  'FoundryTech UK Ltd',
    name:     'FoundryTech UK (Demo)',
  },
  {
    email:    SUPER_ADMIN_EMAIL,
    password: SUPER_ADMIN_PASSWORD,
    role:     'admin',
    is_demo:  false,
    company:  'RZ Global Solutions',
    name:     'Super Admin',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
async function upsertUser({ email, password, role, is_demo, company, name }) {
  // Check if user already exists
  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing?.users?.find((u) => u.email === email);

  let userId;
  if (found) {
    console.log(`  ↩  ${email} already exists — updating password`);
    const { error } = await admin.auth.admin.updateUserById(found.id, { password });
    if (error) console.warn(`     Warning: ${error.message}`);
    userId = found.id;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (error) { console.error(`  ✗  ${email}: ${error.message}`); return null; }
    console.log(`  ✓  ${email} created`);
    userId = data.user.id;
  }

  // Upsert profile
  const { error: profErr } = await admin.from('profiles').upsert({
    id:           userId,
    email,
    role,
    company_name: company,
    status:       'active',
    is_demo,
  }, { onConflict: 'id' });

  if (profErr) console.warn(`     Profile warning for ${email}: ${profErr.message}`);
  return userId;
}

// ── Demo orders (linked to demo client + supplier IDs at runtime) ─────────────
function buildOrders(clientId, supplierId) {
  const now = new Date();
  const daysAgo = (d) => new Date(now - d * 864e5).toISOString();

  return [
    {
      client_id:    clientId,
      supplier_id:  null,
      order_status: 'PENDING_ADMIN_SCRUB',
      part_name:    'Turbine Housing Assembly',
      material:     'Stainless Steel 316L',
      quantity:     24,
      delivery_location: 'Birmingham, B1 1AA',
      selected_processes: ['CASTING', 'MACHINING'],
      buy_price: 8400,
      rz_job_id:    'RZ-JOB-DEMO01',
      created_at:   daysAgo(5),
      updated_at:   daysAgo(5),
    },
    {
      client_id:    clientId,
      supplier_id:  null,
      order_status: 'OPEN_FOR_BIDDING',
      part_name:    'Hydraulic Manifold Block',
      material:     'Aluminium 6061-T6',
      quantity:     50,
      delivery_location: 'Manchester, M1 1AE',
      selected_processes: ['MACHINING', 'QC'],
      buy_price: 5200,
      rz_job_id:    'RZ-JOB-DEMO02',
      created_at:   daysAgo(12),
      updated_at:   daysAgo(3),
    },
    {
      client_id:    clientId,
      supplier_id:  supplierId,
      order_status: 'MACHINING',
      part_name:    'CNC Precision Gear Set',
      material:     'EN36 Alloy Steel',
      quantity:     12,
      delivery_location: 'Sheffield, S1 2HH',
      selected_processes: ['MATERIAL', 'MACHINING', 'QC'],
      buy_price: 6800,
      rz_job_id:    'RZ-JOB-DEMO03',
      created_at:   daysAgo(28),
      updated_at:   daysAgo(2),
    },
    {
      client_id:    clientId,
      supplier_id:  supplierId,
      order_status: 'DISPATCH',
      part_name:    'Pump Body Casting',
      material:     'Bronze LG2',
      quantity:     8,
      delivery_location: 'Leeds, LS1 4AW',
      selected_processes: ['CASTING', 'MACHINING', 'QC'],
      buy_price: 4600,
      rz_job_id:    'RZ-JOB-DEMO04',
      created_at:   daysAgo(45),
      updated_at:   daysAgo(1),
    },
    {
      client_id:    clientId,
      supplier_id:  supplierId,
      order_status: 'DELIVERED',
      part_name:    'Compressor Impeller',
      material:     'Stainless Steel 304',
      quantity:     4,
      delivery_location: 'London, EC1A 1BB',
      selected_processes: ['CASTING', 'MACHINING', 'QC'],
      buy_price: 9200,
      rz_job_id:    'RZ-JOB-DEMO05',
      created_at:   daysAgo(90),
      updated_at:   daysAgo(10),
    },
  ];
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n🚀 RZGB Demo Seed Script\n');

  console.log('Creating users…');
  const ids = {};
  for (const user of USERS) {
    const id = await upsertUser(user);
    if (id) ids[user.role === 'admin' && user.email === SUPER_ADMIN_EMAIL ? 'superadmin' : user.role] = id;
  }

  const clientId   = ids.client;
  const supplierId = ids.supplier;

  if (!clientId || !supplierId) {
    console.error('\n✗ Client or supplier ID missing — skipping order seed.');
    return;
  }

  console.log('\nSeeding demo orders…');

  // Remove existing demo orders for this client first
  await admin.from('orders').delete().eq('client_id', clientId);

  const orders = buildOrders(clientId, supplierId);
  const { error: ordErr } = await admin.from('orders').insert(orders);
  if (ordErr) {
    console.error('  ✗ Orders insert failed:', ordErr.message);
  } else {
    console.log(`  ✓ ${orders.length} demo orders seeded`);
  }

  console.log('\n✅ Seed complete!\n');
  console.log('Demo credentials:');
  console.log('  Client:   demo.client@zaproc.co.uk   /  RZDemo2024!');
  console.log('  Admin:    demo.admin@zaproc.co.uk    /  RZDemo2024!');
  console.log('  Supplier: demo.supplier@zaproc.co.uk /  RZDemo2024!');
  console.log(`  Super Admin: ${SUPER_ADMIN_EMAIL} / ${SUPER_ADMIN_PASSWORD}\n`);
}

run().catch((err) => { console.error(err); process.exit(1); });

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateRZJobId } from '@/lib/generateRZJobId';

// ── Mock supabase + logger ─────────────────────────────────────────────────────

let queryResult = { data: [], error: null };

const chain = {};
['select', 'like', 'order', 'limit'].forEach((m) => {
  chain[m] = vi.fn(() => chain);
});
chain.then = (resolve, reject) => Promise.resolve(queryResult).then(resolve, reject);
chain.catch = (reject) => Promise.resolve(queryResult).catch(reject);

vi.mock('@/lib/customSupabaseClient', () => ({
  supabase: { from: vi.fn(() => chain) },
}));

vi.mock('@/lib/logger', () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

const YEAR = new Date().getFullYear();

beforeEach(() => {
  queryResult = { data: [], error: null };
  vi.clearAllMocks();
  ['select', 'like', 'order', 'limit'].forEach((m) => {
    chain[m].mockReturnValue(chain);
  });
});

// ── generateRZJobId ────────────────────────────────────────────────────────────

describe('generateRZJobId', () => {
  it('returns RZ-JOB-<year>-001 when no IDs exist yet', async () => {
    queryResult = { data: [], error: null };
    const id = await generateRZJobId();
    expect(id).toBe(`RZ-JOB-${YEAR}-001`);
  });

  it('increments the sequence number from the last ID', async () => {
    queryResult = { data: [{ rz_job_id: `RZ-JOB-${YEAR}-009` }], error: null };
    const id = await generateRZJobId();
    expect(id).toBe(`RZ-JOB-${YEAR}-010`);
  });

  it('pads the sequence number with leading zeros to 3 digits', async () => {
    queryResult = { data: [{ rz_job_id: `RZ-JOB-${YEAR}-001` }], error: null };
    const id = await generateRZJobId();
    expect(id).toBe(`RZ-JOB-${YEAR}-002`);
  });

  it('handles double-digit to triple-digit rollover correctly', async () => {
    queryResult = { data: [{ rz_job_id: `RZ-JOB-${YEAR}-099` }], error: null };
    const id = await generateRZJobId();
    expect(id).toBe(`RZ-JOB-${YEAR}-100`);
  });

  it('falls back to -001 when the stored ID has an unexpected format', async () => {
    queryResult = { data: [{ rz_job_id: 'MALFORMED' }], error: null };
    const id = await generateRZJobId();
    expect(id).toBe(`RZ-JOB-${YEAR}-001`);
  });

  it('falls back to -001 when rz_job_id is null', async () => {
    queryResult = { data: [{ rz_job_id: null }], error: null };
    const id = await generateRZJobId();
    expect(id).toBe(`RZ-JOB-${YEAR}-001`);
  });

  it('throws when the database returns an error', async () => {
    queryResult = { data: null, error: new Error('DB connection refused') };
    await expect(generateRZJobId()).rejects.toThrow('DB connection refused');
  });
});

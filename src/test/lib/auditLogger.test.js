import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createAuditLog,
  logMilestoneUpdate,
  logNCRReport,
  logFileRelease,
} from '@/lib/auditLogger';

// ── Mock supabase ──────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  let insertResult = { error: null };

  const chain = {};
  chain.insert = vi.fn(() => chain);
  chain.then = (resolve, reject) => Promise.resolve(insertResult).then(resolve, reject);
  chain.catch = (reject) => Promise.resolve(insertResult).catch(reject);

  return {
    chain,
    mockFrom: vi.fn(() => chain),
    setInsertResult: (v) => { insertResult = v; },
  };
});

vi.mock('@/lib/customSupabaseClient', () => ({
  supabase: { from: mocks.mockFrom },
}));

beforeEach(() => {
  mocks.setInsertResult({ error: null });
  vi.clearAllMocks();
  mocks.mockFrom.mockReturnValue(mocks.chain);
  mocks.chain.insert.mockReturnValue(mocks.chain);
});

// ── createAuditLog ─────────────────────────────────────────────────────────────

describe('createAuditLog', () => {
  it('returns true when the insert succeeds', async () => {
    const result = await createAuditLog({ userId: 'u1', action: 'login', status: 'success', details: {} });
    expect(result).toBe(true);
  });

  it('serialises an object details value to a JSON string', async () => {
    await createAuditLog({ userId: 'u1', action: 'test', status: 'success', details: { key: 'value' } });

    const insertedPayload = mocks.chain.insert.mock.calls[0][0];
    expect(typeof insertedPayload.details).toBe('string');
    expect(JSON.parse(insertedPayload.details)).toEqual({ key: 'value' });
  });

  it('passes a string details value through without double-encoding', async () => {
    await createAuditLog({ userId: 'u1', action: 'test', status: 'success', details: 'plain text' });

    const insertedPayload = mocks.chain.insert.mock.calls[0][0];
    expect(insertedPayload.details).toBe('plain text');
  });

  it('populates both user_id and admin_id with the provided userId', async () => {
    await createAuditLog({ userId: 'user-123', action: 'test', status: 'success', details: {} });

    const insertedPayload = mocks.chain.insert.mock.calls[0][0];
    expect(insertedPayload.user_id).toBe('user-123');
    expect(insertedPayload.admin_id).toBe('user-123');
  });

  it('still returns true (non-blocking) when the DB insert returns an error', async () => {
    // The function deliberately does not block the caller on audit failures.
    // It warns via console.warn but continues and returns true.
    mocks.setInsertResult({ error: { message: 'DB connection lost' } });

    const result = await createAuditLog({ userId: 'u1', action: 'test', status: 'success', details: {} });
    expect(result).toBe(true);
  });

  it('returns false when the DB call throws an exception', async () => {
    // Only a thrown exception (not an error in the response) causes false to be returned.
    mocks.chain.insert.mockImplementationOnce(() => {
      throw new Error('Unexpected crash');
    });

    const result = await createAuditLog({ userId: 'u1', action: 'test', status: 'success', details: {} });
    expect(result).toBe(false);
  });

  it('includes the correct action and status in the payload', async () => {
    await createAuditLog({ userId: 'u1', action: 'file_released', status: 'success', details: {} });

    const insertedPayload = mocks.chain.insert.mock.calls[0][0];
    expect(insertedPayload.action).toBe('file_released');
    expect(insertedPayload.status).toBe('success');
  });

  it('includes orderId in the payload when provided', async () => {
    await createAuditLog({ userId: 'u1', action: 'test', status: 'success', details: {}, orderId: 'order-99' });

    const insertedPayload = mocks.chain.insert.mock.calls[0][0];
    expect(insertedPayload.order_id).toBe('order-99');
  });

  it('sets order_id to null when orderId is not provided', async () => {
    await createAuditLog({ userId: 'u1', action: 'test', status: 'success', details: {} });

    const insertedPayload = mocks.chain.insert.mock.calls[0][0];
    expect(insertedPayload.order_id).toBeNull();
  });
});

// ── Convenience wrappers ───────────────────────────────────────────────────────

describe('logMilestoneUpdate', () => {
  it('calls createAuditLog with action milestone_update', async () => {
    const result = await logMilestoneUpdate('u1', 'order-1', 'QC_PASS');
    expect(result).toBe(true);
    const payload = mocks.chain.insert.mock.calls[0][0];
    expect(payload.action).toBe('milestone_update');
    expect(payload.order_id).toBe('order-1');
  });
});

describe('logNCRReport', () => {
  it('calls createAuditLog with action ncr_reported', async () => {
    await logNCRReport('u1', 'order-2', 'surface_defect');
    const payload = mocks.chain.insert.mock.calls[0][0];
    expect(payload.action).toBe('ncr_reported');
  });
});

describe('logFileRelease', () => {
  it('calls createAuditLog with action file_released', async () => {
    await logFileRelease('u1', 'order-3', 'CLIENT-001');
    const payload = mocks.chain.insert.mock.calls[0][0];
    expect(payload.action).toBe('file_released');
  });
});

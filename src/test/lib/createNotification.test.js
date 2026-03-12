import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNotification } from '@/lib/createNotification';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  let result = { error: null };
  const chain = {};
  ['insert'].forEach((m) => { chain[m] = vi.fn(() => chain); });
  chain.then = (resolve) => Promise.resolve(result).then(resolve);
  return {
    chain,
    mockFrom: vi.fn(() => chain),
    setResult: (v) => { result = v; },
  };
});

vi.mock('@/lib/customSupabaseClient', () => ({
  supabase: { from: mocks.mockFrom },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.setResult({ error: null });
  mocks.mockFrom.mockReturnValue(mocks.chain);
  mocks.chain.insert.mockReturnValue(mocks.chain);
});

// ── createNotification ─────────────────────────────────────────────────────────

describe('createNotification', () => {
  it('inserts a single notification when recipientId is a string', async () => {
    const result = await createNotification({
      recipientId: 'user-1',
      senderId:    'admin-1',
      type:        'BID_AWARDED',
      title:       'Bid Awarded!',
      message:     'Your bid was accepted.',
      link:        '/supplier-hub/jobs/abc',
    });

    expect(result.success).toBe(true);
    expect(mocks.mockFrom).toHaveBeenCalledWith('notifications');
    const payload = mocks.chain.insert.mock.calls[0][0];
    expect(payload).toHaveLength(1);
    expect(payload[0].recipient_id).toBe('user-1');
    expect(payload[0].read).toBe(false);
  });

  it('inserts multiple notifications when recipientId is an array', async () => {
    await createNotification({
      recipientId: ['user-1', 'user-2', 'user-3'],
      senderId:    'admin-1',
      type:        'BID_REJECTED',
      title:       'Bid Not Selected',
      message:     'Your bid was not selected.',
    });

    const payload = mocks.chain.insert.mock.calls[0][0];
    expect(payload).toHaveLength(3);
    expect(payload.map(p => p.recipient_id)).toEqual(['user-1', 'user-2', 'user-3']);
    expect(payload.every(p => p.read === false)).toBe(true);
  });

  it('propagates sender_id, type, title, message, and link onto every row', async () => {
    await createNotification({
      recipientId: ['a', 'b'],
      senderId:    'sender-99',
      type:        'ORDER_UPDATE',
      title:       'Order Updated',
      message:     'Something changed.',
      link:        '/orders/123',
    });

    const payload = mocks.chain.insert.mock.calls[0][0];
    for (const row of payload) {
      expect(row.sender_id).toBe('sender-99');
      expect(row.type).toBe('ORDER_UPDATE');
      expect(row.title).toBe('Order Updated');
      expect(row.message).toBe('Something changed.');
      expect(row.link).toBe('/orders/123');
    }
  });

  it('returns { success: false } when the DB insert returns an error', async () => {
    mocks.setResult({ error: { message: 'insert failed' } });

    const result = await createNotification({
      recipientId: 'user-1',
      senderId:    'admin-1',
      type:        'TEST',
      title:       'T',
      message:     'M',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('wraps a single string recipientId in an array (only one insert call)', async () => {
    await createNotification({ recipientId: 'solo', senderId: 's', type: 'T', title: 'T', message: 'M' });

    expect(mocks.chain.insert).toHaveBeenCalledTimes(1);
    expect(mocks.chain.insert.mock.calls[0][0]).toHaveLength(1);
  });

  it('handles an empty recipientId array without inserting any rows', async () => {
    const result = await createNotification({
      recipientId: [],
      senderId:    'admin-1',
      type:        'TEST',
      title:       'T',
      message:     'M',
    });

    const payload = mocks.chain.insert.mock.calls[0][0];
    expect(payload).toHaveLength(0);
    expect(result.success).toBe(true);
  });
});

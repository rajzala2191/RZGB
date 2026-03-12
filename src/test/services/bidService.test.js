import { describe, it, expect, vi, beforeEach } from 'vitest';
import { awardBid, openOrderForBidding, submitBid } from '@/services/bidService';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  const queue = [];
  let defaultResult = { data: null, error: null };

  const makeChain = () => {
    const c = {};
    ['select', 'eq', 'neq', 'in', 'order', 'insert', 'update', 'delete'].forEach((m) => {
      c[m] = vi.fn(() => c);
    });
    c.maybeSingle = vi.fn(() => c);
    c.single = vi.fn(() => c);
    c.then = (resolve, reject) => {
      const val = queue.length ? queue.shift() : defaultResult;
      return Promise.resolve(val).then(resolve, reject);
    };
    c.catch = (reject) => Promise.resolve(defaultResult).catch(reject);
    return c;
  };

  return {
    chain: makeChain(),
    mockFrom: vi.fn(),
    setDefault: (v) => { defaultResult = v; },
    enqueue: (...vals) => { queue.push(...vals); },
    clearQueue: () => { queue.length = 0; },
  };
});

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: { from: mocks.mockFrom },
}));

vi.mock('@/lib/customSupabaseClient', () => ({
  supabase: { from: mocks.mockFrom },
}));

vi.mock('@/services/slackService', () => ({
  notifyBidAwarded: vi.fn().mockResolvedValue({}),
  notifyNewTender: vi.fn().mockResolvedValue({}),
  notifyNewBid: vi.fn().mockResolvedValue({}),
}));

function resetChain() {
  mocks.clearQueue();
  mocks.setDefault({ data: null, error: null });
  vi.clearAllMocks();
  mocks.mockFrom.mockReturnValue(mocks.chain);
  ['select', 'eq', 'neq', 'in', 'order', 'insert', 'update', 'delete'].forEach((m) => {
    mocks.chain[m].mockReturnValue(mocks.chain);
  });
  mocks.chain.maybeSingle.mockReturnValue(mocks.chain);
  mocks.chain.single.mockReturnValue(mocks.chain);
}

beforeEach(resetChain);

// ── awardBid ───────────────────────────────────────────────────────────────────

describe('awardBid', () => {
  function enqueueHappyPath() {
    mocks.enqueue({ error: null }); // 1. award the winning bid
    mocks.enqueue({ error: null }); // 2. reject competing bids
    mocks.enqueue({ error: null }); // 3. update order (supplier_id, AWARDED, rz_job_id)
    mocks.enqueue({ error: null }); // 4. update documents with supplier_id
    mocks.enqueue({ error: null }); // 5. insert job_update record
    mocks.enqueue({ data: { part_name: 'Widget', ghost_public_name: null }, error: null }); // 6. fetch order for Slack
    mocks.enqueue({ data: { company_name: 'Acme Supplier' }, error: null });               // 7. fetch supplier for Slack
    mocks.enqueue({ data: { amount: 5000, currency: 'GBP' }, error: null });               // 8. fetch bid for Slack
  }

  it('returns a generated rzJobId on success', async () => {
    enqueueHappyPath();
    const result = await awardBid('bid-1', 'order-1', 'supplier-1');
    expect(result).toHaveProperty('rzJobId');
    expect(result.rzJobId).toMatch(/^RZ-\d{4}-\d{4}$/);
  });

  it('marks the winning bid as "awarded"', async () => {
    enqueueHappyPath();
    await awardBid('bid-1', 'order-1', 'supplier-1');

    const awardedUpdate = mocks.chain.update.mock.calls.find(
      (args) => args[0]?.status === 'awarded',
    );
    expect(awardedUpdate).toBeTruthy();
  });

  it('marks competing bids as "rejected"', async () => {
    enqueueHappyPath();
    await awardBid('bid-1', 'order-1', 'supplier-1');

    const rejectedUpdate = mocks.chain.update.mock.calls.find(
      (args) => args[0]?.status === 'rejected',
    );
    expect(rejectedUpdate).toBeTruthy();
  });

  it('updates the order status to AWARDED', async () => {
    enqueueHappyPath();
    await awardBid('bid-1', 'order-1', 'supplier-1');

    const orderUpdate = mocks.chain.update.mock.calls.find(
      (args) => args[0]?.order_status === 'AWARDED',
    );
    expect(orderUpdate).toBeTruthy();
    expect(orderUpdate[0].supplier_id).toBe('supplier-1');
  });

  it('throws and stops execution when the first DB call fails', async () => {
    mocks.enqueue({ error: new Error('Connection refused') });

    await expect(awardBid('bid-1', 'order-1', 'supplier-1')).rejects.toThrow('Connection refused');

    // Only one update call should have been made (the failing one)
    expect(mocks.chain.update.mock.calls).toHaveLength(1);
  });
});

// ── openOrderForBidding ────────────────────────────────────────────────────────

describe('openOrderForBidding', () => {
  it('includes bid_deadline when a deadline is provided', async () => {
    mocks.enqueue({ error: null }); // update order
    mocks.enqueue({ data: { rz_job_id: 'RZ-2026-001', part_name: 'Widget', ghost_public_name: null, material: 'Steel', quantity: 10 }, error: null }); // fetch order for Slack

    const deadline = '2026-06-01T00:00:00Z';
    await openOrderForBidding('order-1', deadline);

    const updatePayload = mocks.chain.update.mock.calls[0][0];
    expect(updatePayload.order_status).toBe('OPEN_FOR_BIDDING');
    expect(updatePayload.bid_deadline).toBe(deadline);
  });

  it('omits bid_deadline when no deadline is provided', async () => {
    mocks.enqueue({ error: null });
    mocks.enqueue({ data: { rz_job_id: 'RZ-2026-001', part_name: 'Widget', ghost_public_name: null, material: 'Steel', quantity: 10 }, error: null });

    await openOrderForBidding('order-1', null);

    const updatePayload = mocks.chain.update.mock.calls[0][0];
    expect(updatePayload).not.toHaveProperty('bid_deadline');
  });
});

// ── submitBid ─────────────────────────────────────────────────────────────────

describe('submitBid', () => {
  it('defaults currency to GBP when not provided', async () => {
    mocks.enqueue({ data: { id: 'bid-new' }, error: null });

    await submitBid({ orderId: 'o1', supplierId: 's1', amount: 500, leadTimeDays: 14 });

    const insertPayload = mocks.chain.insert.mock.calls[0][0][0];
    expect(insertPayload.currency).toBe('GBP');
  });

  it('uses the provided currency when specified', async () => {
    mocks.enqueue({ data: { id: 'bid-new' }, error: null });

    await submitBid({ orderId: 'o1', supplierId: 's1', amount: 500, currency: 'EUR', leadTimeDays: 14 });

    const insertPayload = mocks.chain.insert.mock.calls[0][0][0];
    expect(insertPayload.currency).toBe('EUR');
  });

  it('defaults price_breakdown to empty object when not provided', async () => {
    mocks.enqueue({ data: { id: 'bid-new' }, error: null });

    await submitBid({ orderId: 'o1', supplierId: 's1', amount: 500, leadTimeDays: 14 });

    const insertPayload = mocks.chain.insert.mock.calls[0][0][0];
    expect(insertPayload.price_breakdown).toEqual({});
  });
});

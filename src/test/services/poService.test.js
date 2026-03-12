import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPurchaseOrder, issuePO } from '@/services/poService';

// ── Mock chain with response queue ────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  let defaultResult = { data: null, error: null };
  const queue = [];

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
  notifyPOIssued: vi.fn().mockResolvedValue({}),
  notifyPOAcknowledged: vi.fn().mockResolvedValue({}),
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

// ── createPurchaseOrder ───────────────────────────────────────────────────────

describe('createPurchaseOrder', () => {
  it('creates a PO when the order is AWARDED', async () => {
    mocks.enqueue({ data: { order_status: 'AWARDED' }, error: null }); // order check
    mocks.enqueue({ data: { id: 'po-1', po_number: 'PO-2026-12345' }, error: null }); // insert

    const { data } = await createPurchaseOrder({
      orderId: 'order-1',
      supplierId: 'supplier-1',
      totalAmount: 5000,
      currency: 'GBP',
    });
    expect(data.id).toBe('po-1');
  });

  it('throws when the linked order is not in AWARDED status', async () => {
    mocks.enqueue({ data: { order_status: 'OPEN_FOR_BIDDING' }, error: null });

    await expect(
      createPurchaseOrder({ orderId: 'order-1', supplierId: 'supplier-1', totalAmount: 5000 })
    ).rejects.toThrow('AWARDED');
  });

  it('throws when the order is not found', async () => {
    mocks.enqueue({ data: null, error: null });

    await expect(
      createPurchaseOrder({ orderId: 'order-missing', supplierId: 'supplier-1', totalAmount: 5000 })
    ).rejects.toThrow('AWARDED');
  });

  it('skips the order status check when no orderId is provided', async () => {
    mocks.enqueue({ data: { id: 'po-2', po_number: 'PO-2026-99999' }, error: null }); // insert only

    const { data } = await createPurchaseOrder({
      supplierId: 'supplier-1',
      totalAmount: 1000,
    });
    expect(data.id).toBe('po-2');
    // No 'orders' query should have been made
    expect(mocks.chain.insert.mock.calls).toHaveLength(1);
  });
});

// ── issuePO ───────────────────────────────────────────────────────────────────

describe('issuePO', () => {
  function enqueueHappyPath() {
    mocks.enqueue({ data: { po_status: 'draft' }, error: null }); // PO status check
    mocks.enqueue({ data: null, error: null });                    // no pending approval
    mocks.enqueue({ error: null });                                // update po_status -> issued
    mocks.enqueue({ data: { po_number: 'PO-2026-1', total_amount: 5000, currency: 'GBP', order: { rz_job_id: 'RZ-2026-1' }, supplier: { company_name: 'Acme' } }, error: null }); // slack fetch
  }

  it('issues the PO when it is in draft with no pending approvals', async () => {
    enqueueHappyPath();
    await issuePO('po-1');
    const updateCall = mocks.chain.update.mock.calls.find(
      (args) => args[0]?.po_status === 'issued',
    );
    expect(updateCall).toBeTruthy();
  });

  it('throws when the PO is not in draft status', async () => {
    mocks.enqueue({ data: { po_status: 'issued' }, error: null });

    await expect(issuePO('po-1')).rejects.toThrow('draft status');
  });

  it('throws when the PO is not found', async () => {
    mocks.enqueue({ data: null, error: null });

    await expect(issuePO('po-missing')).rejects.toThrow('draft status');
  });

  it('throws when a pending approval request exists for the PO', async () => {
    mocks.enqueue({ data: { po_status: 'draft' }, error: null });          // PO check
    mocks.enqueue({ data: { id: 'req-1' }, error: null });                 // pending approval found

    await expect(issuePO('po-1')).rejects.toThrow('pending approval');
  });

  it('throws when the DB fails on the PO status check', async () => {
    mocks.enqueue({ data: null, error: new Error('DB error') });

    await expect(issuePO('po-1')).rejects.toThrow('DB error');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clearWithdrawnOrders, generateOrderStepProgress } from '@/services/orderService';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  const queue = [];
  let defaultResult = { data: null, error: null };

  const makeChain = () => {
    const c = {};
    ['select', 'eq', 'neq', 'in', 'order', 'insert', 'update', 'delete', 'like', 'limit'].forEach((m) => {
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
    mockAdminFrom: vi.fn(),
    mockFrom: vi.fn(),
    setDefault: (v) => { defaultResult = v; },
    enqueue: (...vals) => { queue.push(...vals); },
    clearQueue: () => { queue.length = 0; },
  };
});

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: { from: mocks.mockAdminFrom, storage: { from: vi.fn(() => ({ upload: vi.fn() })) } },
}));

vi.mock('@/lib/customSupabaseClient', () => ({
  supabase: { from: mocks.mockFrom, auth: { getUser: vi.fn() } },
}));

function resetChain() {
  mocks.clearQueue();
  mocks.setDefault({ data: null, error: null });
  vi.clearAllMocks();
  mocks.mockAdminFrom.mockReturnValue(mocks.chain);
  mocks.mockFrom.mockReturnValue(mocks.chain);
  ['select', 'eq', 'neq', 'in', 'order', 'insert', 'update', 'delete', 'like', 'limit'].forEach((m) => {
    mocks.chain[m].mockReturnValue(mocks.chain);
  });
  mocks.chain.maybeSingle.mockReturnValue(mocks.chain);
  mocks.chain.single.mockReturnValue(mocks.chain);
}

beforeEach(resetChain);

// ── clearWithdrawnOrders ───────────────────────────────────────────────────────

describe('clearWithdrawnOrders', () => {
  it('returns 0 for an empty input array without making any DB calls', async () => {
    const count = await clearWithdrawnOrders([]);
    expect(count).toBe(0);
    expect(mocks.mockFrom).not.toHaveBeenCalled();
  });

  it('returns the count of successfully cleared orders', async () => {
    // Three orders, all succeed
    mocks.enqueue({ error: null });
    mocks.enqueue({ error: null });
    mocks.enqueue({ error: null });

    const count = await clearWithdrawnOrders(['o1', 'o2', 'o3']);
    expect(count).toBe(3);
  });

  it('counts only successful clears when some orders fail', async () => {
    mocks.enqueue({ error: null });               // o1 succeeds
    mocks.enqueue({ error: new Error('fail') });  // o2 fails
    mocks.enqueue({ error: null });               // o3 succeeds

    const count = await clearWithdrawnOrders(['o1', 'o2', 'o3']);
    expect(count).toBe(2);
  });

  it('returns 0 when all orders fail', async () => {
    mocks.enqueue({ error: new Error('fail') });
    mocks.enqueue({ error: new Error('fail') });

    const count = await clearWithdrawnOrders(['o1', 'o2']);
    expect(count).toBe(0);
  });
});

// ── generateOrderStepProgress ──────────────────────────────────────────────────

describe('generateOrderStepProgress', () => {
  it('returns early without any DB calls when selectedProcesses is empty', async () => {
    const result = await generateOrderStepProgress('order-1', []);
    expect(result).toBeUndefined();
    expect(mocks.mockAdminFrom).not.toHaveBeenCalled();
  });

  it('returns early without any DB calls when selectedProcesses is null', async () => {
    const result = await generateOrderStepProgress('order-1', null);
    expect(result).toBeUndefined();
  });

  it('creates one progress row per sub-step with status "pending"', async () => {
    const selectedProcesses = [
      { id: 'proc-1', status_key: 'CASTING' },
      { id: 'proc-2', status_key: 'MACHINING' },
    ];

    // First call: fetch sub-steps for the given process IDs
    mocks.enqueue({
      data: [
        { id: 'step-a', process_id: 'proc-1' },
        { id: 'step-b', process_id: 'proc-1' },
        { id: 'step-c', process_id: 'proc-2' },
      ],
      error: null,
    });
    // Second call: insert the progress rows
    mocks.enqueue({ data: [{}], error: null });

    await generateOrderStepProgress('order-1', selectedProcesses);

    const insertedRows = mocks.chain.insert.mock.calls[0][0];
    expect(insertedRows).toHaveLength(3);
    expect(insertedRows.every((r) => r.status === 'pending')).toBe(true);
    expect(insertedRows.every((r) => r.order_id === 'order-1')).toBe(true);
  });

  it('maps each sub-step to the correct process_key from selectedProcesses', async () => {
    const selectedProcesses = [
      { id: 'proc-1', status_key: 'CASTING' },
      { id: 'proc-2', status_key: 'MACHINING' },
    ];

    mocks.enqueue({
      data: [
        { id: 'step-a', process_id: 'proc-1' },
        { id: 'step-c', process_id: 'proc-2' },
      ],
      error: null,
    });
    mocks.enqueue({ data: [{}], error: null });

    await generateOrderStepProgress('order-1', selectedProcesses);

    const insertedRows = mocks.chain.insert.mock.calls[0][0];
    const stepA = insertedRows.find((r) => r.sub_step_id === 'step-a');
    const stepC = insertedRows.find((r) => r.sub_step_id === 'step-c');
    expect(stepA.process_key).toBe('CASTING');
    expect(stepC.process_key).toBe('MACHINING');
  });

  it('returns early without inserting when no sub-steps are found', async () => {
    mocks.enqueue({ data: [], error: null });

    const result = await generateOrderStepProgress('order-1', [{ id: 'proc-1', status_key: 'CASTING' }]);
    expect(result).toBeUndefined();
    expect(mocks.chain.insert).not.toHaveBeenCalled();
  });
});

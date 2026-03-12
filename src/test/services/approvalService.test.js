import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchMyPendingApprovals, makeDecision } from '@/services/approvalService';

// ── Mock chain with a response queue ──────────────────────────────────────────
// Each await on the chain pops the next value from `queue`.
// When the queue is empty, `defaultResult` is used.

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

beforeEach(() => {
  mocks.clearQueue();
  mocks.setDefault({ data: null, error: null });
  mocks.mockFrom.mockReturnValue(mocks.chain);
  // Re-attach chain methods after clearAllMocks
  ['select', 'eq', 'neq', 'in', 'order', 'insert', 'update', 'delete'].forEach((m) => {
    mocks.chain[m].mockReturnValue(mocks.chain);
  });
  mocks.chain.maybeSingle.mockReturnValue(mocks.chain);
  mocks.chain.single.mockReturnValue(mocks.chain);
  vi.clearAllMocks();
  mocks.mockFrom.mockReturnValue(mocks.chain);
  ['select', 'eq', 'neq', 'in', 'order', 'insert', 'update', 'delete'].forEach((m) => {
    mocks.chain[m].mockReturnValue(mocks.chain);
  });
  mocks.chain.maybeSingle.mockReturnValue(mocks.chain);
  mocks.chain.single.mockReturnValue(mocks.chain);
});

// ── fetchMyPendingApprovals ────────────────────────────────────────────────────

describe('fetchMyPendingApprovals', () => {
  it('returns empty array when the user has no assigned steps', async () => {
    // First call: fetch steps for user → empty
    mocks.enqueue({ data: [], error: null });

    const result = await fetchMyPendingApprovals('user-1');
    expect(result).toEqual({ data: [] });
  });

  it('returns only requests whose current_step matches an assigned step', async () => {
    // First call: fetch steps for user (assigned to step 2 of workflow wf-1)
    mocks.enqueue({ data: [{ workflow_id: 'wf-1', step_order: 2 }], error: null });
    // Second call: fetch all pending requests
    mocks.enqueue({
      data: [
        { id: 'r1', workflow_id: 'wf-1', current_step: 2, status: 'pending' }, // ✓ match
        { id: 'r2', workflow_id: 'wf-1', current_step: 1, status: 'pending' }, // ✗ wrong step
        { id: 'r3', workflow_id: 'wf-2', current_step: 2, status: 'pending' }, // ✗ wrong workflow
      ],
      error: null,
    });

    const result = await fetchMyPendingApprovals('user-1');
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('r1');
  });

  it('returns empty array when no pending requests match the assigned steps', async () => {
    mocks.enqueue({ data: [{ workflow_id: 'wf-1', step_order: 3 }], error: null });
    mocks.enqueue({
      data: [{ id: 'r1', workflow_id: 'wf-1', current_step: 1, status: 'pending' }],
      error: null,
    });

    const result = await fetchMyPendingApprovals('user-1');
    expect(result.data).toHaveLength(0);
  });
});

// ── makeDecision ───────────────────────────────────────────────────────────────

describe('makeDecision', () => {
  it('marks the request as rejected when decision is "rejected"', async () => {
    // 1. Guard: fetch request
    mocks.enqueue({ data: { workflow_id: 'wf-1', current_step: 1, status: 'pending' }, error: null });
    // 2. Guard: fetch step (no specific approver)
    mocks.enqueue({ data: { approver_id: null }, error: null });
    // 3. Insert decision record
    mocks.enqueue({ error: null });
    // 4. Update request to rejected
    mocks.enqueue({ error: null });

    const result = await makeDecision({
      requestId: 'req-1',
      stepOrder: 1,
      decidedBy: 'admin-1',
      decision: 'rejected',
      comments: 'Not compliant',
    });

    expect(result).toEqual({ success: true });
    // Verify the update was called (update + eq targeting 'rejected' status)
    const updateCall = mocks.chain.update.mock.calls.find(
      (args) => args[0]?.status === 'rejected',
    );
    expect(updateCall).toBeTruthy();
  });

  it('advances to the next step when decision is "approved" and more steps remain', async () => {
    // 1. Guard: fetch request
    mocks.enqueue({ data: { workflow_id: 'wf-1', current_step: 1, status: 'pending' }, error: null });
    // 2. Guard: fetch step (no specific approver)
    mocks.enqueue({ data: { approver_id: null }, error: null });
    // 3. Insert decision record
    mocks.enqueue({ error: null });
    // 4. Fetch the request (for approved-branch step advancement)
    mocks.enqueue({ data: { id: 'req-1', workflow_id: 'wf-1' }, error: null });
    // 5. Fetch all steps for the workflow
    mocks.enqueue({
      data: [{ step_order: 1 }, { step_order: 2 }, { step_order: 3 }],
      error: null,
    });
    // 6. Update request to next step
    mocks.enqueue({ error: null });

    const result = await makeDecision({
      requestId: 'req-1',
      stepOrder: 1,
      decidedBy: 'admin-1',
      decision: 'approved',
    });

    expect(result).toEqual({ success: true });
    const updateCall = mocks.chain.update.mock.calls.find(
      (args) => args[0]?.status === 'in_progress',
    );
    expect(updateCall).toBeTruthy();
    expect(updateCall[0].current_step).toBe(2);
  });

  it('marks the request as fully approved when it is the last step', async () => {
    // 1. Guard: fetch request
    mocks.enqueue({ data: { workflow_id: 'wf-1', current_step: 1, status: 'pending' }, error: null });
    // 2. Guard: fetch step (no specific approver)
    mocks.enqueue({ data: { approver_id: null }, error: null });
    // 3. Insert decision record
    mocks.enqueue({ error: null });
    // 4. Fetch the request (for approved-branch step advancement)
    mocks.enqueue({ data: { id: 'req-1', workflow_id: 'wf-1' }, error: null });
    // 5. Fetch all steps — only one step exists
    mocks.enqueue({ data: [{ step_order: 1 }], error: null });
    // 6. Update request to approved
    mocks.enqueue({ error: null });

    const result = await makeDecision({
      requestId: 'req-1',
      stepOrder: 1,
      decidedBy: 'admin-1',
      decision: 'approved',
    });

    expect(result).toEqual({ success: true });
    const updateCall = mocks.chain.update.mock.calls.find(
      (args) => args[0]?.status === 'approved',
    );
    expect(updateCall).toBeTruthy();
  });

  it('throws when the decision record insert fails', async () => {
    mocks.enqueue({ data: { workflow_id: 'wf-1', current_step: 1, status: 'pending' }, error: null }); // request guard
    mocks.enqueue({ data: { approver_id: null }, error: null });                                        // step guard
    mocks.enqueue({ error: new Error('Insert failed') });

    await expect(
      makeDecision({ requestId: 'req-1', stepOrder: 1, decidedBy: 'admin-1', decision: 'rejected' }),
    ).rejects.toThrow('Insert failed');
  });

  it('throws when the approval request is not found', async () => {
    mocks.enqueue({ data: null, error: null }); // request not found

    await expect(
      makeDecision({ requestId: 'req-missing', stepOrder: 1, decidedBy: 'admin-1', decision: 'approved' }),
    ).rejects.toThrow('Approval request not found');
  });

  it('throws when the request is already approved', async () => {
    mocks.enqueue({ data: { workflow_id: 'wf-1', current_step: 1, status: 'approved' }, error: null });

    await expect(
      makeDecision({ requestId: 'req-1', stepOrder: 1, decidedBy: 'admin-1', decision: 'approved' }),
    ).rejects.toThrow('already approved');
  });

  it('throws when the request is already rejected', async () => {
    mocks.enqueue({ data: { workflow_id: 'wf-1', current_step: 1, status: 'rejected' }, error: null });

    await expect(
      makeDecision({ requestId: 'req-1', stepOrder: 1, decidedBy: 'admin-1', decision: 'rejected' }),
    ).rejects.toThrow('already rejected');
  });

  it('throws when stepOrder does not match the current step', async () => {
    mocks.enqueue({ data: { workflow_id: 'wf-1', current_step: 2, status: 'in_progress' }, error: null });

    await expect(
      makeDecision({ requestId: 'req-1', stepOrder: 1, decidedBy: 'admin-1', decision: 'approved' }),
    ).rejects.toThrow('current step is 2');
  });

  it('throws when the caller is not the authorized approver for the step', async () => {
    mocks.enqueue({ data: { workflow_id: 'wf-1', current_step: 1, status: 'pending' }, error: null });
    mocks.enqueue({ data: { approver_id: 'correct-approver' }, error: null }); // step has a specific approver

    await expect(
      makeDecision({ requestId: 'req-1', stepOrder: 1, decidedBy: 'wrong-user', decision: 'approved' }),
    ).rejects.toThrow('not the authorized approver');
  });

  it('allows any user to decide when the step has no specific approver assigned', async () => {
    mocks.enqueue({ data: { workflow_id: 'wf-1', current_step: 1, status: 'pending' }, error: null }); // request guard
    mocks.enqueue({ data: { approver_id: null }, error: null });                                        // step has no assigned approver
    mocks.enqueue({ error: null });                                                                      // insert decision
    mocks.enqueue({ error: null });                                                                      // update request rejected

    const result = await makeDecision({
      requestId: 'req-1', stepOrder: 1, decidedBy: 'any-admin', decision: 'rejected',
    });
    expect(result).toEqual({ success: true });
  });
});

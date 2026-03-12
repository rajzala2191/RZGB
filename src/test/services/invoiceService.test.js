import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateInvoiceStatus, createInvoice } from '@/services/invoiceService';

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

vi.mock('@/services/webhookService', () => ({
  dispatchWebhookEvent: vi.fn().mockResolvedValue(undefined),
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

// ── updateInvoiceStatus ───────────────────────────────────────────────────────

describe('updateInvoiceStatus', () => {
  describe('transitioning to "paid"', () => {
    it('marks the invoice as paid when it is approved and no PO is linked', async () => {
      mocks.enqueue({ data: { invoice_status: 'approved', total_amount: '5000', po_id: null }, error: null }); // guard fetch
      mocks.enqueue({ error: null }); // update

      await updateInvoiceStatus('inv-1', 'paid', 'admin-1');

      const updateCall = mocks.chain.update.mock.calls.find(
        (args) => args[0]?.invoice_status === 'paid',
      );
      expect(updateCall).toBeTruthy();
      expect(updateCall[0].paid_date).toBeTruthy();
    });

    it('throws when the invoice is not yet approved', async () => {
      mocks.enqueue({ data: { invoice_status: 'submitted', total_amount: '5000', po_id: null }, error: null });

      await expect(updateInvoiceStatus('inv-1', 'paid')).rejects.toThrow('approved before marking as paid');
    });

    it('throws when the invoice is not found', async () => {
      mocks.enqueue({ data: null, error: null });

      await expect(updateInvoiceStatus('inv-missing', 'paid')).rejects.toThrow('approved before marking as paid');
    });

    it('passes 3-way match when invoice total is within 5% of PO total', async () => {
      mocks.enqueue({ data: { invoice_status: 'approved', total_amount: '5200', po_id: 'po-1' }, error: null });
      mocks.enqueue({ data: { total_amount: '5000' }, error: null }); // PO fetch (5200 vs 5000 = 4% diff)
      mocks.enqueue({ error: null }); // update

      await updateInvoiceStatus('inv-1', 'paid', 'admin-1');

      const updateCall = mocks.chain.update.mock.calls.find(
        (args) => args[0]?.invoice_status === 'paid',
      );
      expect(updateCall).toBeTruthy();
    });

    it('throws when invoice total exceeds PO total by more than 5%', async () => {
      mocks.enqueue({ data: { invoice_status: 'approved', total_amount: '6000', po_id: 'po-1' }, error: null });
      mocks.enqueue({ data: { total_amount: '5000' }, error: null }); // PO fetch (6000 vs 5000 = 20% diff)

      await expect(updateInvoiceStatus('inv-1', 'paid')).rejects.toThrow('3-way match failed');
    });

    it('skips 3-way match when PO fetch returns an error', async () => {
      mocks.enqueue({ data: { invoice_status: 'approved', total_amount: '9999', po_id: 'po-1' }, error: null });
      mocks.enqueue({ data: null, error: new Error('PO not found') }); // PO fetch fails
      mocks.enqueue({ error: null }); // update proceeds anyway

      await updateInvoiceStatus('inv-1', 'paid', 'admin-1');

      const updateCall = mocks.chain.update.mock.calls.find(
        (args) => args[0]?.invoice_status === 'paid',
      );
      expect(updateCall).toBeTruthy();
    });

    it('sets reviewed_by and reviewed_at when reviewedBy is provided', async () => {
      mocks.enqueue({ data: { invoice_status: 'approved', total_amount: '1000', po_id: null }, error: null });
      mocks.enqueue({ error: null });

      await updateInvoiceStatus('inv-1', 'paid', 'admin-1');

      const updateCall = mocks.chain.update.mock.calls.find(
        (args) => args[0]?.invoice_status === 'paid',
      );
      expect(updateCall[0].reviewed_by).toBe('admin-1');
      expect(updateCall[0].reviewed_at).toBeTruthy();
    });
  });

  describe('transitioning to non-paid statuses', () => {
    it('updates status without guard checks when transitioning to "approved"', async () => {
      mocks.enqueue({ error: null });

      await updateInvoiceStatus('inv-1', 'approved', 'admin-1');

      const updateCall = mocks.chain.update.mock.calls.find(
        (args) => args[0]?.invoice_status === 'approved',
      );
      expect(updateCall).toBeTruthy();
      // Guard fetch (select) should NOT have been called for 'approved'
      expect(mocks.chain.select.mock.calls).toHaveLength(0);
    });

    it('updates status without any checks when transitioning to "rejected"', async () => {
      mocks.enqueue({ error: null });

      await updateInvoiceStatus('inv-1', 'rejected');

      const updateCall = mocks.chain.update.mock.calls.find(
        (args) => args[0]?.invoice_status === 'rejected',
      );
      expect(updateCall).toBeTruthy();
    });
  });
});

// ── createInvoice ─────────────────────────────────────────────────────────────

describe('createInvoice', () => {
  it('generates a unique invoice number with the current year', async () => {
    mocks.enqueue({ data: { id: 'inv-new', invoice_number: 'INV-2026-12345' }, error: null });

    await createInvoice({ supplierId: 's1', amount: 500, taxAmount: 50 });

    const insertPayload = mocks.chain.insert.mock.calls[0][0][0];
    expect(insertPayload.invoice_number).toMatch(/^INV-\d{4}-\d{5}$/);
  });

  it('computes total_amount as amount + taxAmount', async () => {
    mocks.enqueue({ data: { id: 'inv-new' }, error: null });

    await createInvoice({ supplierId: 's1', amount: 1000, taxAmount: 200 });

    const insertPayload = mocks.chain.insert.mock.calls[0][0][0];
    expect(insertPayload.total_amount).toBe(1200);
  });

  it('defaults currency to GBP when not provided', async () => {
    mocks.enqueue({ data: { id: 'inv-new' }, error: null });

    await createInvoice({ supplierId: 's1', amount: 500 });

    const insertPayload = mocks.chain.insert.mock.calls[0][0][0];
    expect(insertPayload.currency).toBe('GBP');
  });

  it('sets invoice_status to "submitted" on creation', async () => {
    mocks.enqueue({ data: { id: 'inv-new' }, error: null });

    await createInvoice({ supplierId: 's1', amount: 500 });

    const insertPayload = mocks.chain.insert.mock.calls[0][0][0];
    expect(insertPayload.invoice_status).toBe('submitted');
  });
});

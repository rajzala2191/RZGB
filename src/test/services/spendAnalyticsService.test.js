import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchSpendBySupplier,
  fetchSpendByMaterial,
  fetchSpendOverTime,
  fetchSpendSummary,
  fetchBidSavings,
} from '@/services/spendAnalyticsService';

// ── Shared mock chain ──────────────────────────────────────────────────────────
// All builder methods return `chain`; `then` resolves with the current `result`.
// Each test sets `result` before invoking the service function.

let result = { data: null, error: null };

const chain = {};
['select', 'not', 'in', 'eq', 'order', 'gte', 'limit'].forEach((m) => {
  chain[m] = vi.fn(() => chain);
});
chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
chain.catch = (reject) => Promise.resolve(result).catch(reject);

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: { from: vi.fn(() => chain) },
}));

beforeEach(() => {
  result = { data: null, error: null };
  vi.clearAllMocks();
  // Re-attach after clearAllMocks wipes the implementations
  ['select', 'not', 'in', 'eq', 'order', 'gte', 'limit'].forEach((m) => {
    chain[m].mockReturnValue(chain);
  });
});

// ── fetchSpendBySupplier ───────────────────────────────────────────────────────

describe('fetchSpendBySupplier', () => {
  it('groups orders by supplier name and sums buy_price', async () => {
    result = {
      data: [
        { supplier_id: 's1', buy_price: '1000', supplier: { company_name: 'Acme' } },
        { supplier_id: 's1', buy_price: '500', supplier: { company_name: 'Acme' } },
        { supplier_id: 's2', buy_price: '2000', supplier: { company_name: 'Beta' } },
      ],
      error: null,
    };

    const output = await fetchSpendBySupplier();

    expect(output).toHaveLength(2);
    expect(output[0]).toEqual({ supplier: 'Beta', total: 2000, count: 1 });
    expect(output[1]).toEqual({ supplier: 'Acme', total: 1500, count: 2 });
  });

  it('sorts by total descending', async () => {
    result = {
      data: [
        { buy_price: '100', supplier: { company_name: 'Low' } },
        { buy_price: '9000', supplier: { company_name: 'High' } },
        { buy_price: '500', supplier: { company_name: 'Mid' } },
      ],
      error: null,
    };

    const output = await fetchSpendBySupplier();
    expect(output.map((o) => o.supplier)).toEqual(['High', 'Mid', 'Low']);
  });

  it('falls back to "Unknown" when supplier relation is missing', async () => {
    result = {
      data: [{ buy_price: '300', supplier: null }],
      error: null,
    };

    const output = await fetchSpendBySupplier();
    expect(output[0].supplier).toBe('Unknown');
  });

  it('returns empty array when data is null', async () => {
    result = { data: null, error: null };
    expect(await fetchSpendBySupplier()).toEqual([]);
  });

  it('coerces non-numeric buy_price to 0', async () => {
    result = {
      data: [{ buy_price: 'N/A', supplier: { company_name: 'X' } }],
      error: null,
    };
    const output = await fetchSpendBySupplier();
    expect(output[0].total).toBe(0);
  });
});

// ── fetchSpendByMaterial ───────────────────────────────────────────────────────

describe('fetchSpendByMaterial', () => {
  it('groups orders by material and sums buy_price', async () => {
    result = {
      data: [
        { material: 'Steel', buy_price: '800' },
        { material: 'Steel', buy_price: '200' },
        { material: 'Aluminium', buy_price: '1500' },
      ],
      error: null,
    };

    const output = await fetchSpendByMaterial();
    expect(output[0]).toEqual({ material: 'Aluminium', total: 1500, count: 1 });
    expect(output[1]).toEqual({ material: 'Steel', total: 1000, count: 2 });
  });

  it('returns empty array when data is null', async () => {
    result = { data: null, error: null };
    expect(await fetchSpendByMaterial()).toEqual([]);
  });
});

// ── fetchSpendOverTime ─────────────────────────────────────────────────────────

describe('fetchSpendOverTime', () => {
  it('groups orders into YYYY-MM buckets and sorts ascending', async () => {
    result = {
      data: [
        { created_at: '2026-01-15T00:00:00Z', buy_price: '500' },
        { created_at: '2026-03-10T00:00:00Z', buy_price: '300' },
        { created_at: '2026-01-28T00:00:00Z', buy_price: '200' },
      ],
      error: null,
    };

    const output = await fetchSpendOverTime();
    expect(output).toHaveLength(2);
    expect(output[0]).toEqual({ month: '2026-01', total: 700, count: 2 });
    expect(output[1]).toEqual({ month: '2026-03', total: 300, count: 1 });
  });

  it('returns empty array when data is null', async () => {
    result = { data: null, error: null };
    expect(await fetchSpendOverTime()).toEqual([]);
  });
});

// ── fetchSpendSummary ──────────────────────────────────────────────────────────

describe('fetchSpendSummary', () => {
  it('computes totals, active and delivered counts', async () => {
    result = {
      data: [
        { buy_price: '1000', order_status: 'AWARDED' },
        { buy_price: '2000', order_status: 'MACHINING' },
        { buy_price: '500', order_status: 'DELIVERED' },
        { buy_price: '300', order_status: 'WITHDRAWN' }, // not counted in active/delivered
      ],
      error: null,
    };

    const output = await fetchSpendSummary();
    expect(output.totalSpend).toBe(3800);
    expect(output.activeOrders).toBe(2);
    expect(output.deliveredOrders).toBe(1);
    expect(output.avgOrderValue).toBe(950);
  });

  it('returns zeros when data is null', async () => {
    result = { data: null, error: null };
    const output = await fetchSpendSummary();
    expect(output).toEqual({
      totalSpend: 0,
      activeOrders: 0,
      deliveredOrders: 0,
      avgOrderValue: 0,
    });
  });

  it('avgOrderValue is 0 when data array is empty', async () => {
    result = { data: [], error: null };
    const output = await fetchSpendSummary();
    expect(output.avgOrderValue).toBe(0);
  });
});

// ── fetchBidSavings ────────────────────────────────────────────────────────────

describe('fetchBidSavings', () => {
  it('calculates savings as highest_bid minus awarded_bid', async () => {
    result = {
      data: [
        { order_id: 'o1', amount: '5000', status: 'awarded' },
        { order_id: 'o1', amount: '7000', status: 'rejected' },
        { order_id: 'o1', amount: '6500', status: 'pending' },
      ],
      error: null,
    };

    const output = await fetchBidSavings();
    expect(output.totalSaved).toBe(2000); // 7000 - 5000
    expect(output.ordersWithSavings).toBe(1);
  });

  it('does not count savings when there is only one bid per order', async () => {
    result = {
      data: [{ order_id: 'o1', amount: '5000', status: 'awarded' }],
      error: null,
    };

    const output = await fetchBidSavings();
    expect(output.totalSaved).toBe(0);
    expect(output.ordersWithSavings).toBe(0);
  });

  it('does not count savings when the awarded bid is the highest', async () => {
    result = {
      data: [
        { order_id: 'o1', amount: '9000', status: 'awarded' },
        { order_id: 'o1', amount: '6000', status: 'rejected' },
      ],
      error: null,
    };

    const output = await fetchBidSavings();
    expect(output.totalSaved).toBe(0);
    expect(output.ordersWithSavings).toBe(0);
  });

  it('accumulates savings across multiple orders', async () => {
    result = {
      data: [
        { order_id: 'o1', amount: '4000', status: 'awarded' },
        { order_id: 'o1', amount: '6000', status: 'rejected' },
        { order_id: 'o2', amount: '1000', status: 'awarded' },
        { order_id: 'o2', amount: '1500', status: 'rejected' },
      ],
      error: null,
    };

    const output = await fetchBidSavings();
    expect(output.totalSaved).toBe(2500); // 2000 + 500
    expect(output.ordersWithSavings).toBe(2);
  });

  it('returns empty array when data is null', async () => {
    result = { data: null, error: null };
    expect(await fetchBidSavings()).toEqual([]);
  });
});

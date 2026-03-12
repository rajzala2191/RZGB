import { describe, it, expect } from 'vitest';
import { pctColor, pctBg } from '@/pages/SupplierScorecardPage';

// ── pctColor ───────────────────────────────────────────────────────────────────

describe('pctColor (higher = better)', () => {
  it('returns slate-500 for null', () => {
    expect(pctColor(null)).toBe('text-slate-500');
  });

  it('returns emerald-400 for on-time % >= 90', () => {
    expect(pctColor(90)).toBe('text-emerald-400');
    expect(pctColor(100)).toBe('text-emerald-400');
  });

  it('returns amber-400 for on-time % between 70 and 89', () => {
    expect(pctColor(70)).toBe('text-amber-400');
    expect(pctColor(85)).toBe('text-amber-400');
  });

  it('returns red-400 for on-time % below 70', () => {
    expect(pctColor(69)).toBe('text-red-400');
    expect(pctColor(0)).toBe('text-red-400');
  });
});

describe('pctColor (lower = better / invert mode)', () => {
  it('returns slate-500 for null in invert mode', () => {
    expect(pctColor(null, true)).toBe('text-slate-500');
  });

  it('returns emerald-400 for NCR rate <= 2', () => {
    expect(pctColor(0,   true)).toBe('text-emerald-400');
    expect(pctColor(2,   true)).toBe('text-emerald-400');
  });

  it('returns amber-400 for NCR rate between 2.1 and 5', () => {
    expect(pctColor(3,   true)).toBe('text-amber-400');
    expect(pctColor(5,   true)).toBe('text-amber-400');
  });

  it('returns red-400 for NCR rate above 5', () => {
    expect(pctColor(6,   true)).toBe('text-red-400');
    expect(pctColor(100, true)).toBe('text-red-400');
  });
});

// ── pctBg ─────────────────────────────────────────────────────────────────────

describe('pctBg (higher = better)', () => {
  it('returns slate fallback for null', () => {
    expect(pctBg(null)).toBe('bg-slate-800/40');
  });

  it('returns emerald background for pct >= 90', () => {
    expect(pctBg(95)).toBe('bg-emerald-950/30');
  });

  it('returns amber background for pct in [70, 89]', () => {
    expect(pctBg(75)).toBe('bg-amber-950/30');
  });

  it('returns red background for pct < 70', () => {
    expect(pctBg(50)).toBe('bg-red-950/30');
  });
});

describe('pctBg (lower = better / invert mode)', () => {
  it('returns slate fallback for null in invert mode', () => {
    expect(pctBg(null, true)).toBe('bg-slate-800/40');
  });

  it('returns emerald background for NCR rate <= 2', () => {
    expect(pctBg(1, true)).toBe('bg-emerald-950/30');
  });

  it('returns amber background for NCR rate in (2, 5]', () => {
    expect(pctBg(4, true)).toBe('bg-amber-950/30');
  });

  it('returns red background for NCR rate > 5', () => {
    expect(pctBg(10, true)).toBe('bg-red-950/30');
  });
});

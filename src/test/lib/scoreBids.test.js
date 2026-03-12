import { describe, it, expect } from 'vitest';
import { scoreBids } from '@/pages/BidComparisonPage';

// ── scoreBids ──────────────────────────────────────────────────────────────────

describe('scoreBids', () => {
  it('returns an empty array when given no bids', () => {
    expect(scoreBids([])).toEqual([]);
  });

  it('gives a single bid with detailed notes a max score of 94 (50+30+14)', () => {
    const [bid] = scoreBids([
      { id: '1', amount: 500, lead_time_days: 10, notes: 'Certified manufacturer with proven track record.' },
    ]);
    expect(bid.score).toBe(94);
  });

  it('gives a single bid with no notes a score of 80 (price 50% + lead 30%, 0 notes)', () => {
    const [bid] = scoreBids([
      { id: '1', amount: 500, lead_time_days: 10, notes: '' },
    ]);
    expect(bid.score).toBe(80);
  });

  it('ranks the cheapest bid first when lead time and notes are equal', () => {
    const result = scoreBids([
      { id: 'expensive', amount: 1000, lead_time_days: 10, notes: '' },
      { id: 'cheap',     amount: 500,  lead_time_days: 10, notes: '' },
    ]);
    expect(result[0].id).toBe('cheap');
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it('ranks the fastest bid first when price is equal', () => {
    const result = scoreBids([
      { id: 'slow', amount: 500, lead_time_days: 30, notes: '' },
      { id: 'fast', amount: 500, lead_time_days: 5,  notes: '' },
    ]);
    expect(result[0].id).toBe('fast');
  });

  it('awards a notes bonus for bids with more than 20 chars of notes', () => {
    const [withNotes, withoutNotes] = scoreBids([
      { id: 'detailed', amount: 500, lead_time_days: 10, notes: 'We have ISO certification and can deliver on time.' },
      { id: 'empty',    amount: 500, lead_time_days: 10, notes: '' },
    ]);
    expect(withNotes.score).toBeGreaterThan(withoutNotes.score);
  });

  it('awards a partial notes bonus for bids with 1–20 chars of notes', () => {
    const [withShortNote, withoutNotes] = scoreBids([
      { id: 'short',   amount: 500, lead_time_days: 10, notes: 'On time.' },
      { id: 'nothing', amount: 500, lead_time_days: 10, notes: '' },
    ]);
    expect(withShortNote.score).toBeGreaterThan(withoutNotes.score);
  });

  it('attaches priceScore and leadScore properties to each bid', () => {
    const [bid] = scoreBids([{ id: '1', amount: 100, lead_time_days: 5, notes: '' }]);
    expect(bid).toHaveProperty('priceScore');
    expect(bid).toHaveProperty('leadScore');
  });

  it('preserves original bid properties on each output object', () => {
    const [bid] = scoreBids([
      { id: 'x', amount: 999, lead_time_days: 7, notes: 'test', supplier: { company_name: 'ACME' } },
    ]);
    expect(bid.id).toBe('x');
    expect(bid.amount).toBe(999);
    expect(bid.supplier.company_name).toBe('ACME');
  });

  it('handles identical prices without dividing by zero', () => {
    expect(() =>
      scoreBids([
        { id: '1', amount: 500, lead_time_days: 10, notes: '' },
        { id: '2', amount: 500, lead_time_days: 10, notes: '' },
      ])
    ).not.toThrow();
  });

  it('handles identical lead times without dividing by zero', () => {
    expect(() =>
      scoreBids([
        { id: '1', amount: 100, lead_time_days: 14, notes: '' },
        { id: '2', amount: 200, lead_time_days: 14, notes: '' },
      ])
    ).not.toThrow();
  });

  it('returns scores as integers (Math.round applied)', () => {
    const result = scoreBids([
      { id: '1', amount: 100, lead_time_days: 5,  notes: '' },
      { id: '2', amount: 200, lead_time_days: 10, notes: '' },
    ]);
    for (const bid of result) {
      expect(Number.isInteger(bid.score)).toBe(true);
      expect(Number.isInteger(bid.priceScore)).toBe(true);
      expect(Number.isInteger(bid.leadScore)).toBe(true);
    }
  });
});

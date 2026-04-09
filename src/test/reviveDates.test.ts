import { describe, it, expect } from 'vitest';
import { reviveDatesExternal } from '../utils/reviveDates';

describe('reviveDatesExternal', () => {
  it('returns null as-is', () => {
    expect(reviveDatesExternal(null)).toBeNull();
  });

  it('returns undefined as-is', () => {
    expect(reviveDatesExternal(undefined)).toBeUndefined();
  });

  it('converts ISO date string to Date', () => {
    const result = reviveDatesExternal('2025-01-15T10:30:00.000Z');
    expect(result).toBeInstanceOf(Date);
    expect((result as Date).getFullYear()).toBe(2025);
  });

  it('leaves non-date strings unchanged', () => {
    expect(reviveDatesExternal('hello')).toBe('hello');
    expect(reviveDatesExternal('2025-01-15')).toBe('2025-01-15'); // no time component
    expect(reviveDatesExternal('')).toBe('');
  });

  it('recursively converts dates in arrays', () => {
    const input = ['2025-01-15T10:00:00.000Z', 'not a date'];
    const result = reviveDatesExternal(input) as any[];
    expect(result[0]).toBeInstanceOf(Date);
    expect(result[1]).toBe('not a date');
  });

  it('recursively converts dates in objects', () => {
    const input = { name: 'Aaryana', createdAt: '2025-03-01T00:00:00.000Z', score: 95 };
    const result = reviveDatesExternal(input) as any;
    expect(result.name).toBe('Aaryana');
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.score).toBe(95);
  });

  it('handles nested objects', () => {
    const input = { a: { b: { date: '2025-06-01T00:00:00.000Z' } } };
    const result = reviveDatesExternal(input) as any;
    expect(result.a.b.date).toBeInstanceOf(Date);
  });

  it('passes through numbers and booleans unchanged', () => {
    expect(reviveDatesExternal(42)).toBe(42);
    expect(reviveDatesExternal(true)).toBe(true);
    expect(reviveDatesExternal(false)).toBe(false);
  });

  it('handles arrays inside objects', () => {
    const input = { logs: ['2025-01-01T00:00:00.000Z', '2025-02-01T00:00:00.000Z'] };
    const result = reviveDatesExternal(input) as any;
    expect(result.logs[0]).toBeInstanceOf(Date);
    expect(result.logs[1]).toBeInstanceOf(Date);
  });
});

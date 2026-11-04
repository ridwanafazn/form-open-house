import { describe, it, expect } from 'vitest';
import { formatWib, isoToWibInput, wibInputToIso } from '../../src/lib/deadline';

describe('wibInputToIso', () => {
  it('menafsirkan input datetime-local sebagai WIB', () => {
    expect(wibInputToIso('2026-11-05T23:59')).toBe('2026-11-05T16:59:00.000Z');
  });

  it('nilai kosong menjadi null', () => {
    expect(wibInputToIso('')).toBeNull();
    expect(wibInputToIso('   ')).toBeNull();
  });

  it('nilai tidak valid menjadi null', () => {
    expect(wibInputToIso('bukan-tanggal')).toBeNull();
  });
});

describe('isoToWibInput', () => {
  it('mengubah ISO UTC kembali ke jam WIB', () => {
    expect(isoToWibInput('2026-11-05T16:59:00.000Z')).toBe('2026-11-05T23:59');
  });

  it('nilai kosong/tidak valid menjadi string kosong', () => {
    expect(isoToWibInput(null)).toBe('');
    expect(isoToWibInput('bukan-tanggal')).toBe('');
  });
});

describe('formatWib', () => {
  it('menampilkan tanggal dan jam dalam WIB', () => {
    expect(formatWib('2026-11-05T16:59:00.000Z')).toContain('WIB');
    expect(formatWib('2026-11-05T16:59:00.000Z')).toContain('23.59');
  });
});

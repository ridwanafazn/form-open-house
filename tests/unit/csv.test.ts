import { describe, it, expect } from 'vitest';
import { escapeCell, toCellString, buildCsvRow, buildCsv, CSV_HEADERS } from '../../src/lib/csv';
import type { CsvRow } from '../../src/lib/csv';

describe('escapeCell', () => {
  it('nilai normal tidak diubah', () => {
    expect(escapeCell('Subang')).toBe('Subang');
  });

  it('awalan = diberi petik tunggal', () => {
    expect(escapeCell('=SUM(A1)')).toBe("'=SUM(A1)");
  });

  it('awalan + diberi petik tunggal', () => {
    expect(escapeCell('+62812')).toBe("'+62812");
  });

  it('awalan - diberi petik tunggal', () => {
    expect(escapeCell('-formula')).toBe("'-formula");
  });

  it('awalan @ diberi petik tunggal', () => {
    expect(escapeCell('@user')).toBe("'@user");
  });

  it('nilai dengan koma dibungkus petik ganda', () => {
    expect(escapeCell('Subang, Jawa Barat')).toBe('"Subang, Jawa Barat"');
  });

  it('nilai dengan petik ganda di dalam: petik digandakan dan dibungkus', () => {
    expect(escapeCell('dia bilang "halo"')).toBe('"dia bilang ""halo"""');
  });

  it('nilai dengan baris baru dibungkus petik ganda', () => {
    expect(escapeCell('baris\nsatu')).toBe('"baris\nsatu"');
  });

  it('awalan = DAN mengandung koma: petik tunggal dulu, lalu bungkus', () => {
    // setelah ditambah petik tunggal, string mengandung koma → dibungkus lagi
    expect(escapeCell('=A1,B1')).toBe(`"'=A1,B1"`);
  });
});

describe('toCellString', () => {
  it('null → string kosong', () => {
    expect(toCellString(null)).toBe('');
  });

  it('undefined → string kosong', () => {
    expect(toCellString(undefined)).toBe('');
  });

  it('angka diubah ke string', () => {
    expect(toCellString(3)).toBe('3');
  });

  it('string biasa dilewatkan', () => {
    expect(toCellString('SMP Negeri 1')).toBe('SMP Negeri 1');
  });
});

describe('buildCsvRow', () => {
  it('menyusun baris dengan koma sebagai pemisah', () => {
    // nomor dengan awalan + diproteksi (petik tunggal) sesuai aturan formula injection
    expect(buildCsvRow(['Budi', '+6281234', null, 2])).toBe("Budi,'+6281234,,2");
  });

  it('nilai dengan awalan berbahaya diproteksi', () => {
    const row = buildCsvRow(['=ATTACK', 'normal']);
    expect(row).toBe("'=ATTACK,normal");
  });
});

describe('buildCsv', () => {
  it('baris pertama adalah header yang benar', () => {
    const csv = buildCsv([]);
    const firstLine = csv.split('\r\n')[0];
    expect(firstLine).toBe(CSV_HEADERS.join(','));
  });

  it('jumlah kolom header sama dengan 13', () => {
    expect(CSV_HEADERS.length).toBe(13);
  });

  it('satu baris data menghasilkan dua baris (header + data)', () => {
    const row: CsvRow = {
      created_at: '2026-11-07T08:00:00Z',
      child_name: 'Ahmad',
      parent_phone: '+6281122223934',
      parent_name: 'Budi',
      attendee_count: 2,
      city: 'Subang',
      school: 'SMP Negeri 1 Subang',
      interest_major: 'RPL',
      utm_source: 'instagram',
      utm_campaign: 'openhouse',
      followup_status: 'belum_dihubungi',
      assigned_to: null,
      followup_note: null,
    };
    const lines = buildCsv([row]).split('\r\n');
    expect(lines.length).toBe(2);
    expect(lines[1]).toContain('Ahmad');
    expect(lines[1]).toContain('instagram');
  });

  it('nilai null pada baris menjadi kolom kosong', () => {
    const row: CsvRow = {
      created_at: null,
      child_name: 'Cici',
      parent_phone: null,
      parent_name: null,
      attendee_count: null,
      city: null,
      school: null,
      interest_major: null,
      utm_source: null,
      utm_campaign: null,
      followup_status: null,
      assigned_to: null,
      followup_note: null,
    };
    const lines = buildCsv([row]).split('\r\n');
    // kolom 1 (created_at) kosong, kolom 2 (child_name) = Cici
    expect(lines[1].startsWith(',Cici,')).toBe(true);
  });

  it('baris ganda menghasilkan jumlah baris yang benar', () => {
    const makeRow = (name: string): CsvRow => ({
      created_at: null, child_name: name, parent_phone: null,
      parent_name: null, attendee_count: null, city: null, school: null,
      interest_major: null, utm_source: null, utm_campaign: null,
      followup_status: null, assigned_to: null, followup_note: null,
    });
    const lines = buildCsv([makeRow('A'), makeRow('B'), makeRow('C')]).split('\r\n');
    expect(lines.length).toBe(4); // 1 header + 3 data
  });
});

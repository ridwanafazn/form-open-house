// Pembuat CSV di browser untuk ekspor data admin.
// Tidak ada dependensi eksternal; tidak ada efek samping selain downloadCsv.

export interface CsvRow {
  created_at: string | null;
  child_name: string | null;
  parent_phone: string | null;
  parent_name: string | null;
  attendee_count: number | null;
  city: string | null;
  school: string | null;
  interest_major: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  followup_status: string | null;
  assigned_to: string | null;
  followup_note: string | null;
}

export const CSV_HEADERS = [
  'Waktu daftar',
  'Nama anak',
  'Nomor',
  'Nama orang tua',
  'Jumlah hadir',
  'Kota',
  'Sekolah',
  'Minat jurusan',
  'Sumber',
  'Kampanye',
  'Status',
  'Penanggung jawab',
  'Catatan',
] as const;

/**
 * Lindungi dari injeksi rumus spreadsheet.
 * Sel yang diawali =, +, -, @ diberi tanda petik tunggal di depan.
 * Nilai yang mengandung koma, petik, atau baris baru dibungkus dengan petik ganda,
 * dan petik ganda di dalam nilai digandakan.
 */
export function escapeCell(value: string): string {
  if (/^[=+\-@]/.test(value)) {
    value = "'" + value;
  }
  if (/[",\n\r]/.test(value)) {
    value = '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

/** Ubah satu nilai (string | number | null | undefined) ke string aman untuk CSV. */
export function toCellString(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return escapeCell(String(value));
}

/** Susun satu baris CSV dari array nilai mentah. */
export function buildCsvRow(cells: Array<string | number | null | undefined>): string {
  return cells.map(toCellString).join(',');
}

/** Susun seluruh string CSV dari array baris data. */
export function buildCsv(rows: CsvRow[]): string {
  const header = CSV_HEADERS.join(',');
  const body = rows.map((r) =>
    buildCsvRow([
      r.created_at,
      r.child_name,
      r.parent_phone,
      r.parent_name,
      r.attendee_count,
      r.city,
      r.school,
      r.interest_major,
      r.utm_source,
      r.utm_campaign,
      r.followup_status,
      r.assigned_to,
      r.followup_note,
    ]),
  );
  return [header, ...body].join('\r\n');
}

/**
 * Unduh string CSV sebagai berkas di browser.
 * Gunakan BOM UTF-8 agar Excel membaca karakter Indonesia dengan benar.
 */
export function downloadCsv(filename: string, csv: string): void {
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

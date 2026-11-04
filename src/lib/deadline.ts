/**
 * Utilitas tenggat pendaftaran dalam zona waktu Asia/Jakarta (WIB).
 *
 * Nilai disimpan sebagai ISO UTC di database, tetapi admin mengisinya lewat
 * input `datetime-local` yang tidak membawa zona waktu. Agar tidak bergantung
 * pada zona perangkat admin, input selalu ditafsirkan sebagai WIB (UTC+7).
 */

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

/** `2026-11-05T23:59` (WIB) -> `2026-11-05T16:59:00.000Z`. */
export function wibInputToIso(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const ms = Date.parse(`${trimmed}:00+07:00`);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

/** ISO UTC -> `2026-11-05T23:59` untuk nilai input `datetime-local`. */
export function isoToWibInput(iso: string | null | undefined): string {
  const ms = typeof iso === 'string' ? Date.parse(iso) : NaN;
  if (!Number.isFinite(ms)) return '';
  return new Date(ms + WIB_OFFSET_MS).toISOString().slice(0, 16);
}

/** Format ramah untuk ditampilkan di panel admin, contoh: `5 Nov 2026, 23.59 WIB`. */
export function formatWib(iso: string | null | undefined): string {
  const ms = typeof iso === 'string' ? Date.parse(iso) : NaN;
  if (!Number.isFinite(ms)) return '';
  return `${new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ms))} WIB`;
}

// Penangkapan parameter kunjungan UTM dan fbclid, disimpan di sessionStorage.
// Nilai yang sudah tersimpan tidak ditimpa oleh parameter baru (TRD).

const PARAM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
] as const;

export type TrackingParams = Partial<Record<(typeof PARAM_KEYS)[number], string>>;

export function readParamsFromUrl(): TrackingParams {
  if (typeof window === 'undefined') return {};
  const out: TrackingParams = {};
  const url = new URL(window.location.href);
  for (const key of PARAM_KEYS) {
    const val = url.searchParams.get(key);
    if (val) out[key] = val;
  }
  return out;
}

export function getStoredTracking(): TrackingParams {
  if (typeof window === 'undefined') return {};
  const out: TrackingParams = {};
  for (const key of PARAM_KEYS) {
    const val = window.sessionStorage.getItem(key);
    if (val) out[key] = val;
  }
  return out;
}

// Dipanggil sekali saat halaman utama dimuat: isi nilai baru dari URL hanya
// untuk parameter yang belum tersimpan.
export function captureTracking(): TrackingParams {
  const stored = getStoredTracking();
  const fromUrl = readParamsFromUrl();
  for (const key of PARAM_KEYS) {
    if (stored[key]) continue;
    if (fromUrl[key]) {
      try {
        window.sessionStorage.setItem(key, fromUrl[key] as string);
      } catch {
        // storage penuh; abaikan
      }
    }
  }
  return getStoredTracking();
}

// Kumpulan untuk dikirim bersama payload, tanpa kolom kosong.
export function trackingForSubmit(): TrackingParams {
  return getStoredTracking();
}

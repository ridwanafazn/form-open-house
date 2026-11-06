// Sumber tunggal pembagian kelompok dan rotasi tour kampus.
// Dipakai oleh rundown publik, halaman /kelompok, dan pengujian.

// Pendaftar online dibagi ke dua kelompok saja karena jumlahnya sedikit.
export const BASE_GROUP_CODES = ['A', 'B'] as const;

// Pendaftar manual yang masuk di hari acara langsung ditempatkan di kelompok C.
export const MANUAL_GROUP_CODE = 'C' as const;

export const GROUP_CODES = ['A', 'B', 'C'] as const;

export type GroupCode = (typeof GROUP_CODES)[number];

export interface GroupRoute {
  code: GroupCode;
  label: string;
  stops: readonly string[];
  /** Lokasi yang dikunjungi setelah sesi ketiga, bila ada. */
  returnStop: string | null;
  /** Label tebal untuk langkah terakhir, misalnya "Tetap di Gedung Sekolah". */
  returnLabel: string | null;
  note: string;
}

export interface TourSession {
  number: number;
  time: string;
  locations: Record<GroupCode, string>;
}

export const groupRoutes: readonly GroupRoute[] = [
  {
    code: 'A',
    label: 'Kelompok A',
    stops: ['Gedung Sekolah', 'Laboratorium', 'Asrama'],
    returnStop: 'Gedung Sekolah',
    returnLabel: 'Kembali ke Gedung Sekolah',
    note: 'Kembali ke Gedung Sekolah sebagai titik kumpul.',
  },
  {
    code: 'B',
    label: 'Kelompok B',
    stops: ['Laboratorium', 'Asrama', 'Gedung Sekolah'],
    returnStop: 'Gedung Sekolah',
    returnLabel: 'Tetap di Gedung Sekolah',
    note: 'Gedung Sekolah adalah titik akhir tour sekaligus titik kumpul.',
  },
  {
    code: 'C',
    label: 'Kelompok C',
    stops: ['Asrama', 'Gedung Sekolah', 'Laboratorium'],
    returnStop: 'Gedung Sekolah',
    returnLabel: 'Kembali ke Gedung Sekolah',
    note: 'Khusus pendaftar manual di hari acara. Kembali ke Gedung Sekolah sebagai titik kumpul.',
  },
];

export const tourSessions: readonly TourSession[] = [
  {
    number: 1,
    time: '09.45–10.15',
    locations: {
      A: 'Gedung Sekolah',
      B: 'Laboratorium',
      C: 'Asrama',
    },
  },
  {
    number: 2,
    time: '10.15–10.45',
    locations: {
      A: 'Laboratorium',
      B: 'Asrama',
      C: 'Gedung Sekolah',
    },
  },
  {
    number: 3,
    time: '10.45–11.15',
    locations: {
      A: 'Asrama',
      B: 'Gedung Sekolah',
      C: 'Laboratorium',
    },
  },
];

export const finalMeetingPoint = 'Gedung Sekolah';

export function getGroupRoute(code: GroupCode): GroupRoute {
  const route = groupRoutes.find((item) => item.code === code);
  if (!route) throw new Error(`Rute kelompok ${code} tidak ditemukan.`);
  return route;
}

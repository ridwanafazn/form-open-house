import {
  BASE_GROUP_CODES,
  MANUAL_GROUP_CODE,
  type GroupCode,
} from '../config/groups';

export interface GroupableRegistration {
  id: string;
  created_at: string;
  attendee_count: number;
  followup_status?: string | null;
  /** `manual` untuk pendaftar yang dicatat panitia pada hari acara. */
  source?: string | null;
}

export interface AssignedRegistration<T extends GroupableRegistration> {
  registration: T;
  group_code: GroupCode;
}

/**
 * Bagi peserta ke kelompok secara deterministik.
 *
 * Pendaftar online dibagi ke kelompok A dan B secara berurutan berdasarkan
 * waktu mendaftar (created_at naik, lalu id). Pendaftar paling awal masuk
 * kelompok A, pendaftar yang lebih baru masuk kelompok B. Jumlah anggota tiap
 * kelompok dibuat hampir sama dengan membagi daftar menjadi beberapa potongan
 * berurutan.
 *
 * Pendaftar manual (source `manual`) langsung ditempatkan di kelompok C dan
 * tidak ikut menggeser pembagian A/B. Keluarga berstatus tidak_jadi tetap
 * dihitung sebagai slot agar pembatalan tidak menggeser kelompok keluarga
 * lain. Pemanggil yang menampilkan daftar publik bertanggung jawab menyaring
 * status tidak_jadi.
 */
export function assignGroups<T extends GroupableRegistration>(
  rows: readonly T[],
  codes: readonly GroupCode[] = BASE_GROUP_CODES,
  manualCode: GroupCode = MANUAL_GROUP_CODE,
): AssignedRegistration<T>[] {
  if (codes.length === 0) return [];

  const ordered = [...rows].sort(compareRegistrations);
  const online = ordered.filter((registration) => registration.source !== 'manual');
  const chunkSize = Math.max(1, Math.ceil(online.length / codes.length));

  const assignments = new Map<string, GroupCode>();

  online.forEach((registration, index) => {
    const groupIndex = Math.min(codes.length - 1, Math.floor(index / chunkSize));
    assignments.set(registration.id, codes[groupIndex]);
  });

  for (const registration of ordered) {
    if (registration.source === 'manual') {
      assignments.set(registration.id, manualCode);
    }
  }

  return ordered.map((registration) => ({
    registration,
    group_code: assignments.get(registration.id) ?? codes[0],
  }));
}

function compareRegistrations(
  a: GroupableRegistration,
  b: GroupableRegistration,
): number {
  const aTime = Date.parse(a.created_at);
  const bTime = Date.parse(b.created_at);
  const safeATime = Number.isFinite(aTime) ? aTime : 0;
  const safeBTime = Number.isFinite(bTime) ? bTime : 0;

  if (safeATime !== safeBTime) return safeATime - safeBTime;
  return a.id.localeCompare(b.id);
}

/**
 * Samarkan nama anak untuk halaman publik: kata pertama + inisial kata kedua.
 * Contoh: "Ahmad Fauzan" menjadi "Ahmad F.".
 */
export function maskChildName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Peserta';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
}

export interface GroupTotals {
  familyCount: number;
  attendeeCount: number;
}

export function summarizeGroup<T extends GroupableRegistration>(
  assigned: readonly AssignedRegistration<T>[],
  code: GroupCode,
): GroupTotals {
  return assigned
    .filter((item) => item.group_code === code)
    .reduce<GroupTotals>(
      (totals, item) => ({
        familyCount: totals.familyCount + 1,
        attendeeCount: totals.attendeeCount + Math.max(0, Number(item.registration.attendee_count) || 0),
      }),
      { familyCount: 0, attendeeCount: 0 },
    );
}

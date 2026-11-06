import { describe, expect, it } from 'vitest';
import { assignGroups, maskChildName, summarizeGroup } from '../../src/lib/groups';

function row(
  id: string,
  createdAt: string,
  attendeeCount: number,
  followupStatus = 'belum_dihubungi',
) {
  return {
    id,
    created_at: createdAt,
    attendee_count: attendeeCount,
    followup_status: followupStatus,
  };
}

describe('assignGroups', () => {
  it('membagi pendaftar online ke dua kelompok berdasarkan urutan waktu daftar', () => {
    const rows = [
      row('1', '2026-11-01T08:00:00.000Z', 4),
      row('2', '2026-11-01T08:01:00.000Z', 2),
      row('3', '2026-11-01T08:02:00.000Z', 3),
      row('4', '2026-11-01T08:03:00.000Z', 5),
      row('5', '2026-11-01T08:04:00.000Z', 1),
      row('6', '2026-11-01T08:05:00.000Z', 2),
    ];

    const assigned = assignGroups(rows);

    expect(assigned.map((item) => item.registration.id)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ]);
    expect(assigned.map((item) => item.group_code)).toEqual(['A', 'A', 'A', 'B', 'B', 'B']);
  });

  it('membagi berurutan menjadi kelompok awal dan kelompok akhir', () => {
    const rows = [
      row('1', '2026-11-01T08:00:00.000Z', 2),
      row('2', '2026-11-01T08:01:00.000Z', 2),
      row('3', '2026-11-01T08:02:00.000Z', 2),
    ];

    expect(assignGroups(rows).map((item) => item.group_code)).toEqual(['A', 'A', 'B']);
  });

  it('tidak menggeser kelompok lama saat peserta baru ditambahkan di akhir', () => {
    const rows = [
      row('1', '2026-11-01T08:00:00.000Z', 4),
      row('2', '2026-11-01T08:01:00.000Z', 2),
      row('3', '2026-11-01T08:02:00.000Z', 3),
    ];

    const before = assignGroups(rows);
    const after = assignGroups([...rows, row('4', '2026-11-01T09:00:00.000Z', 2)]);

    expect(after.slice(0, before.length).map((item) => item.group_code)).toEqual(
      before.map((item) => item.group_code),
    );
  });

  it('tetap memberi slot untuk pendaftar tidak jadi agar kelompok lain stabil', () => {
    const rows = [
      row('1', '2026-11-01T08:00:00.000Z', 4),
      row('2', '2026-11-01T08:01:00.000Z', 2, 'tidak_jadi'),
      row('3', '2026-11-01T08:02:00.000Z', 3),
    ];

    const assigned = assignGroups(rows);
    expect(assigned.map((item) => item.group_code)).toEqual(['A', 'A', 'B']);
    expect(
      assigned
        .filter((item) => item.registration.followup_status !== 'tidak_jadi')
        .map((item) => item.group_code),
    ).toEqual(['A', 'B']);
  });

  it('menempatkan peserta input manual langsung ke kelompok C', () => {
    const rows = [
      row('1', '2026-11-01T08:00:00.000Z', 4),
      row('2', '2026-11-01T08:01:00.000Z', 2),
      { ...row('3', '2026-11-01T08:02:00.000Z', 3), source: 'manual' },
      row('4', '2026-11-01T08:03:00.000Z', 5),
    ];

    const assigned = assignGroups(rows);
    expect(assigned.map((item) => item.group_code)).toEqual(['A', 'A', 'C', 'B']);
    expect(assigned.find((item) => item.registration.source === 'manual')?.group_code).toBe('C');
  });

  it('memakai id untuk urutan yang sama', () => {
    const rows = [
      row('b', '2026-11-01T08:00:00.000Z', 1),
      row('a', '2026-11-01T08:00:00.000Z', 1),
    ];

    expect(assignGroups(rows).map((item) => item.registration.id)).toEqual(['a', 'b']);
  });

  it('menghitung ringkasan keluarga dan orang per kelompok', () => {
    const rows = [
      row('1', '2026-11-01T08:00:00.000Z', 2),
      row('2', '2026-11-01T08:01:00.000Z', 3),
      row('3', '2026-11-01T08:02:00.000Z', 4),
    ];
    const assigned = assignGroups(rows);

    expect(summarizeGroup(assigned, 'A')).toEqual({ familyCount: 2, attendeeCount: 5 });
    expect(summarizeGroup(assigned, 'B')).toEqual({ familyCount: 1, attendeeCount: 4 });
    expect(summarizeGroup(assigned, 'C')).toEqual({ familyCount: 0, attendeeCount: 0 });
  });
});

describe('maskChildName', () => {
  it('menyisakan nama depan dan inisial nama kedua', () => {
    expect(maskChildName('Ahmad Fauzan')).toBe('Ahmad F.');
    expect(maskChildName('  Ahmad   Fauzan  ')).toBe('Ahmad F.');
  });

  it('tetap menampilkan nama tunggal', () => {
    expect(maskChildName('Ahmad')).toBe('Ahmad');
  });

  it('memberi fallback bila nama kosong', () => {
    expect(maskChildName('   ')).toBe('Peserta');
  });
});

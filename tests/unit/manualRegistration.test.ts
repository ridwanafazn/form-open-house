import { describe, expect, it } from 'vitest';
import {
  buildManualRegistrationPayload,
  validateManualRegistration,
} from '../../src/lib/manualRegistration';

const baseInput = {
  child_name: 'Ahmad Fauzan',
  parent_name: 'Budi',
  parent_phone: '081234567890',
  attendee_count: 3,
  city: 'Subang',
  school: 'SMP Negeri 1 Subang',
  interest_major: 'rpl',
  followup_status: 'belum_dihubungi',
  assigned_to: 'Panitia A',
  followup_note: 'Dari kertas registrasi.',
  created_at: '2026-11-07T01:00:00.000Z',
  attended_at: '',
};

describe('validateManualRegistration', () => {
  it('menerima data manual yang lengkap', () => {
    const result = validateManualRegistration(baseInput);

    expect(result.ok).toBe(true);
    expect(result.value.parent_phone).toBe('+6281234567890');
    expect(result.value.child_name).toBe('Ahmad Fauzan');
    expect(result.value.interest_major).toBe('rpl');
  });

  it('mengizinkan nomor HP kosong', () => {
    const result = validateManualRegistration({ ...baseInput, parent_phone: '' });

    expect(result.ok).toBe(true);
    expect(result.value.parent_phone).toBe('');
  });

  it('menolak nomor HP yang tidak valid', () => {
    const result = validateManualRegistration({ ...baseInput, parent_phone: '123' });
    expect(result.ok).toBe(false);
    expect(result.errors.parent_phone).toBe('phone');
  });

  it('menolak jumlah hadir di luar 1 sampai 10', () => {
    const result = validateManualRegistration({ ...baseInput, attendee_count: 11 });
    expect(result.ok).toBe(false);
    expect(result.errors.attendee_count).toBe('attendee_count');
  });

  it('mewajibkan sekolah dan kota', () => {
    const result = validateManualRegistration({ ...baseInput, school: '', city: '' });
    expect(result.ok).toBe(false);
    expect(result.errors.school).toBe('required');
    expect(result.errors.city).toBe('required');
  });

  it('menolak waktu daftar yang tidak valid', () => {
    const result = validateManualRegistration({ ...baseInput, created_at: 'bukan tanggal' });
    expect(result.ok).toBe(false);
    expect(result.errors.created_at).toBe('required');
  });

  it('memakai status awal bila status kosong', () => {
    const result = validateManualRegistration({ ...baseInput, followup_status: '' });
    expect(result.ok).toBe(true);
    expect(result.value.followup_status).toBe('belum_dihubungi');
  });
});

describe('buildManualRegistrationPayload', () => {
  it('menandai baris sebagai manual dan menyimpan kode tiket', () => {
    const result = validateManualRegistration(baseInput);
    expect(result.ok).toBe(true);

    const payload = buildManualRegistrationPayload(result.value, 'OH-ABC234');

    expect(payload.source).toBe('manual');
    expect(payload.ticket_code).toBe('OH-ABC234');
    expect(payload.consent_wa).toBe(true);
    expect(payload.created_at).toBe(baseInput.created_at);
    expect(payload.attended_at).toBeNull();
  });

  it('mengubah nilai opsional yang kosong menjadi null', () => {
    const result = validateManualRegistration({
      ...baseInput,
      parent_name: '',
      parent_phone: '',
      interest_major: '',
      assigned_to: '',
      followup_note: '',
    });
    expect(result.ok).toBe(true);

    const payload = buildManualRegistrationPayload(result.value, 'OH-ABC234');

    expect(payload.parent_name).toBeNull();
    expect(payload.parent_phone).toBeNull();
    expect(payload.interest_major).toBeNull();
    expect(payload.assigned_to).toBeNull();
    expect(payload.followup_note).toBeNull();
  });
});

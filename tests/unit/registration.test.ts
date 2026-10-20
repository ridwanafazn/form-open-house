import { describe, it, expect } from 'vitest';
import { normalizePhone, isValidPhone } from '../../src/lib/phone';
import { validateRegistration } from '../../src/lib/validate';

describe('normalizePhone', () => {
  it.each([
    ['081234567890', '+6281234567890'],
    ['81234567890', '+6281234567890'],
    ['6281234567890', '+6281234567890'],
    ['+6281234567890', '+6281234567890'],
    ['0812-3456-7890', '+6281234567890'],
    ['0812 3456 7890', '+6281234567890'],
    ['+62 812 3456 7890', '+6281234567890'],
    ['08123', '+628123'],
    ['0898888888', '+62898888888'],
    ['0821 1111 2222', '+6282111112222'],
  ])('normalisasi %s -> %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });
});

describe('isValidPhone', () => {
  it('menerima 628 diikuti 8-11 digit', () => {
    expect(isValidPhone('+6281234567890')).toBe(true); // 10 digit setelah 62
    expect(isValidPhone('+62812345678')).toBe(true); // 8 digit
    expect(isValidPhone('+62812345678901')).toBe(true); // 11 digit
  });
  it('menolak terlalu pendek / terlalu panjang / non-angka', () => {
    expect(isValidPhone('+628123')).toBe(false);
    expect(isValidPhone('+628123456789012')).toBe(false); // 12 digit
    expect(isValidPhone('+628123456a')).toBe(false);
    expect(isValidPhone('081234567890')).toBe(false); // tanpa +
  });
});

const validBase = {
  child_name: 'Ahmad',
  parent_phone: '081234567890',
  city: 'Subang',
  school: 'SMP Negeri 1 Subang',
  attendee_count: 2,
  consent_wa: true,
  interest_major: 'rpl' as const,
};

describe('validateRegistration', () => {
  it('lolos saat semua wajib valid', () => {
    const r = validateRegistration(validBase);
    expect(r.ok).toBe(true);
    expect(r.value.parent_phone).toBe('+6281234567890');
  });
  it('name_short untuk child_name terlalu pendek atau panjang', () => {
    expect(validateRegistration({ ...validBase, child_name: 'A' }).errors.child_name).toBe('name_short');
    expect(
      validateRegistration({ ...validBase, child_name: 'A'.repeat(101) }).errors.child_name,
    ).toBe('name_short');
    expect(validateRegistration(validBase).errors.child_name).toBeUndefined();
  });
  it('phone untuk nomor tidak valid', () => {
    expect(validateRegistration({ ...validBase, parent_phone: '123' }).errors.parent_phone).toBe('phone');
    expect(validateRegistration({ ...validBase, parent_phone: 'abc' }).errors.parent_phone).toBe('phone');
    expect(validateRegistration(validBase).errors.parent_phone).toBeUndefined();
  });
  it('name_short untuk parent_name yang terlalu pendek, kosong boleh', () => {
    expect(validateRegistration({ ...validBase, parent_name: '' }).ok).toBe(true);
    expect(validateRegistration({ ...validBase, parent_name: 'A' }).errors.parent_name).toBe('name_short');
    expect(validateRegistration(validBase).errors.parent_name).toBeUndefined();
  });
  it('attendee_count harus 1-10', () => {
    expect(validateRegistration({ ...validBase, attendee_count: 0 }).errors.attendee_count).toBe('attendee_count');
    expect(validateRegistration({ ...validBase, attendee_count: 11 }).errors.attendee_count).toBe('attendee_count');
    expect(validateRegistration({ ...validBase, attendee_count: 1 }).ok).toBe(true);
    expect(validateRegistration({ ...validBase, attendee_count: 10 }).ok).toBe(true);
  });
  it('city dan school wajib', () => {
    expect(validateRegistration({ ...validBase, city: '' }).errors.city).toBe('required');
    expect(validateRegistration({ ...validBase, school: '' }).errors.school).toBe('required');
  });
  it('interest_major hanya rpl, dkv, belum_tahu', () => {
    expect(validateRegistration({ ...validBase, interest_major: 'dkv' }).value.interest_major).toBe('dkv');
    expect(validateRegistration({ ...validBase, interest_major: 'mipa' }).value.interest_major).toBe('');
    expect(validateRegistration({ ...validBase, interest_major: '' }).ok).toBe(true);
  });
  it('consent_wa wajib true', () => {
    expect(validateRegistration({ ...validBase, consent_wa: false }).errors.consent_wa).toBe('consent');
    expect(validateRegistration(validBase).ok).toBe(true);
  });
  it('device hanya mobile, tablet, desktop, selain itu kosongkan', () => {
    expect(validateRegistration({ ...validBase, device: 'mobile' as const }).value.device).toBe('mobile');
    expect(validateRegistration({ ...validBase, device: 'mobil' as const }).value.device).toBe('');
  });
});

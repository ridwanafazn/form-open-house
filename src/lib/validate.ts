import { normalizePhone, isValidPhone } from './phone';

// Semua teks dipangkas spasi di ujung dan spasi ganda dirapatkan.
function clean(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[ \t]+/g, ' ').trim();
}

export type MajorInterest = 'rpl' | 'dkv' | 'belum_tahu';
export type Device = 'mobile' | 'tablet' | 'desktop';

export interface RegistrationInput {
  child_name?: unknown;
  parent_phone?: unknown;
  parent_name?: unknown;
  attendee_count?: unknown;
  city?: unknown;
  school?: unknown;
  interest_major?: unknown;
  consent_wa?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  utm_content?: unknown;
  utm_term?: unknown;
  fbclid?: unknown;
  referrer?: unknown;
  device?: unknown;
}

export interface RegistrationValue extends RegistrationInput {
  child_name: string;
  parent_phone: string;
  parent_name: string;
  attendee_count: number;
  city: string;
  school: string;
  interest_major: MajorInterest | '';
  consent_wa: boolean;
}

export type Errors = Record<string, string>;

const MAJORS = new Set<MajorInterest>(['rpl', 'dkv', 'belum_tahu']);
const DEVICES = new Set<Device>(['mobile', 'tablet', 'desktop']);

export function validateRegistration(
  input: RegistrationInput,
): { ok: boolean; errors: Errors; value: RegistrationValue } {
  const errors: Errors = {} as Errors;
  const value = {} as RegistrationValue;

  const child_name = clean(input.child_name);
  if (child_name.length < 2) errors.child_name = 'name_short';
  else if (child_name.length > 100) errors.child_name = 'name_short';
  value.child_name = child_name;

  const rawPhone = clean(input.parent_phone);
  const parent_phone = rawPhone ? normalizePhone(rawPhone) : '';
  if (rawPhone && isValidPhone(parent_phone)) {
    value.parent_phone = parent_phone;
  } else {
    errors.parent_phone = 'phone';
    value.parent_phone = parent_phone;
  }

  const parent_name = clean(input.parent_name);
  if (parent_name.length < 2 || parent_name.length > 100) {
    errors.parent_name = 'name_short';
  }
  value.parent_name = parent_name;

  const rawCount = input.attendee_count;
  const parsed = typeof rawCount === 'string' ? Number(rawCount) : (rawCount as number);
  const attendee_count = Number.isInteger(parsed) ? parsed : NaN;
  if (!Number.isInteger(attendee_count) || attendee_count < 1 || attendee_count > 10) {
    errors.attendee_count = 'attendee_count';
  }
  value.attendee_count = Number.isInteger(attendee_count) ? attendee_count : 0;

  const city = clean(input.city);
  if (city.length < 2) errors.city = 'required';
  else if (city.length > 80) errors.city = 'required';
  value.city = city;

  const school = clean(input.school);
  if (school.length < 2) errors.school = 'required';
  else if (school.length > 120) errors.school = 'required';
  value.school = school;

  const rawMajor = clean(input.interest_major);
  const interest_major = (MAJORS.has(rawMajor as MajorInterest) ? rawMajor : '') as
    | MajorInterest
    | '';
  // Seluruh field wajib: minat jurusan harus dipilih salah satu.
  if (!interest_major) errors.interest_major = 'required';
  value.interest_major = interest_major;

  const consent_wa = input.consent_wa === true;
  if (!consent_wa) errors.consent_wa = 'consent';
  value.consent_wa = consent_wa;

  // Kolom pelacakan: dipangkas dan dibatasi panjang. Nilai tidak memengaruhi ok.
  value.utm_source = clampText(input.utm_source, 100);
  value.utm_medium = clampText(input.utm_medium, 100);
  value.utm_campaign = clampText(input.utm_campaign, 100);
  value.utm_content = clampText(input.utm_content, 100);
  value.utm_term = clampText(input.utm_term, 100);
  value.fbclid = clampText(input.fbclid, 300);
  value.referrer = clampText(input.referrer, 300);
  const rawDevice = clean(input.device);
  value.device = (DEVICES.has(rawDevice as Device) ? rawDevice : '') as Device | '';

  return { ok: Object.keys(errors).length === 0, errors, value };
}

function clampText(input: unknown, max: number): string {
  const s = clean(input);
  if (!s) return '';
  return s.length > max ? s.slice(0, max) : s;
}

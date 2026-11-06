import { isValidPhone, normalizePhone } from './phone';

export const MANUAL_STATUSES = [
  'belum_dihubungi',
  'sudah_dihubungi',
  'merespons',
  'tertarik',
  'sudah_daftar_pmb',
  'tidak_jadi',
] as const;

export type ManualStatus = (typeof MANUAL_STATUSES)[number];

export const MANUAL_MAJORS = ['rpl', 'dkv', 'belum_tahu'] as const;

export type ManualMajor = (typeof MANUAL_MAJORS)[number];

export interface ManualRegistrationInput {
  child_name?: unknown;
  parent_name?: unknown;
  parent_phone?: unknown;
  attendee_count?: unknown;
  city?: unknown;
  school?: unknown;
  interest_major?: unknown;
  followup_status?: unknown;
  assigned_to?: unknown;
  followup_note?: unknown;
  created_at?: unknown;
  attended_at?: unknown;
}

export interface ManualRegistrationValue {
  child_name: string;
  parent_name: string;
  parent_phone: string;
  attendee_count: number;
  city: string;
  school: string;
  interest_major: ManualMajor | '';
  followup_status: ManualStatus;
  assigned_to: string;
  followup_note: string;
  created_at: string;
  attended_at: string;
}

export type ManualErrors = Partial<Record<keyof ManualRegistrationInput, string>>;

const statusSet = new Set<string>(MANUAL_STATUSES);
const majorSet = new Set<string>(MANUAL_MAJORS);

function clean(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[ \t]+/g, ' ').trim();
}

function validIso(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

export function validateManualRegistration(input: ManualRegistrationInput): {
  ok: boolean;
  errors: ManualErrors;
  value: ManualRegistrationValue;
} {
  const errors: ManualErrors = {};

  const child_name = clean(input.child_name);
  if (child_name.length < 2 || child_name.length > 100) errors.child_name = 'name_short';

  const parent_name = clean(input.parent_name);
  if (parent_name && (parent_name.length < 2 || parent_name.length > 100)) {
    errors.parent_name = 'name_short';
  }

  const rawPhone = clean(input.parent_phone);
  let parent_phone = '';
  if (rawPhone) {
    parent_phone = normalizePhone(rawPhone);
    if (!isValidPhone(parent_phone)) errors.parent_phone = 'phone';
  }

  const parsedCount =
    typeof input.attendee_count === 'string'
      ? Number(input.attendee_count)
      : (input.attendee_count as number);
  const attendee_count = Number.isInteger(parsedCount) ? parsedCount : 0;
  if (attendee_count < 1 || attendee_count > 10) errors.attendee_count = 'attendee_count';

  const city = clean(input.city);
  if (city.length < 2 || city.length > 80) errors.city = 'required';

  const school = clean(input.school);
  if (school.length < 2 || school.length > 120) errors.school = 'required';

  const rawMajor = clean(input.interest_major);
  const interest_major = (majorSet.has(rawMajor) ? rawMajor : '') as ManualMajor | '';
  if (rawMajor && !interest_major) errors.interest_major = 'required';

  const rawStatus = clean(input.followup_status) || 'belum_dihubungi';
  const followup_status = (statusSet.has(rawStatus)
    ? rawStatus
    : 'belum_dihubungi') as ManualStatus;
  if (!statusSet.has(rawStatus)) errors.followup_status = 'required';

  const assigned_to = clean(input.assigned_to);
  if (assigned_to.length > 100) errors.assigned_to = 'required';

  const followup_note = clean(input.followup_note);
  if (followup_note.length > 1000) errors.followup_note = 'required';

  const createdAt = clean(input.created_at);
  if (!validIso(createdAt)) errors.created_at = 'required';

  const attended_at = clean(input.attended_at);
  if (attended_at && !validIso(attended_at)) errors.attended_at = 'required';

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      child_name,
      parent_name,
      parent_phone,
      attendee_count,
      city,
      school,
      interest_major,
      followup_status,
      assigned_to,
      followup_note,
      created_at: createdAt,
      attended_at,
    },
  };
}

export function buildManualRegistrationPayload(
  value: ManualRegistrationValue,
  ticketCode: string,
): Record<string, unknown> {
  return {
    child_name: value.child_name,
    parent_name: value.parent_name || null,
    parent_phone: value.parent_phone || null,
    attendee_count: value.attendee_count,
    city: value.city,
    school: value.school,
    interest_major: value.interest_major || null,
    followup_status: value.followup_status,
    assigned_to: value.assigned_to || null,
    followup_note: value.followup_note || null,
    consent_wa: true,
    consent_at: value.created_at,
    source: 'manual',
    ticket_code: ticketCode,
    created_at: value.created_at,
    attended_at: value.attended_at || null,
  };
}

export type FollowupStatus =
  | 'belum_dihubungi'
  | 'sudah_dihubungi'
  | 'merespons'
  | 'tertarik'
  | 'tidak_jadi'
  | 'sudah_daftar_pmb';

export interface Registration {
  id: string;
  created_at: string;
  child_name: string;
  parent_phone: string;
  parent_name: string | null;
  attendee_count: number;
  city: string;
  school: string;
  interest_major: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  referrer: string | null;
  device: string | null;
  followup_status: FollowupStatus;
  assigned_to: string | null;
  followup_note: string | null;
  ticket_code: string | null;
  attended_at: string | null;
}

export type Screen = 'login' | 'checking' | 'list' | 'detail';
export type Tab = 'list' | 'scan';

export const STATUS_LABELS: Record<FollowupStatus, string> = {
  belum_dihubungi: 'Belum dihubungi',
  sudah_dihubungi: 'Sudah dihubungi',
  merespons: 'Merespons',
  tertarik: 'Tertarik',
  tidak_jadi: 'Tidak jadi',
  sudah_daftar_pmb: 'Sudah daftar PMB',
};
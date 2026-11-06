import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { generateTicketCode } from '../../lib/ticketCode';
import { isoToWibInput, wibInputToIso } from '../../lib/deadline';
import {
  MANUAL_MAJORS,
  MANUAL_STATUSES,
  buildManualRegistrationPayload,
  validateManualRegistration,
} from '../../lib/manualRegistration';
import type { ManualErrors, ManualMajor, ManualStatus } from '../../lib/manualRegistration';
import { STATUS_LABELS } from './types';
import type { FollowupStatus, Registration } from './types';

interface ManualEntryTabProps {
  onCreated: (row: Registration) => void;
}

const MAJOR_LABELS: Record<ManualMajor, string> = {
  rpl: 'RPL',
  dkv: 'DKV',
  belum_tahu: 'Belum tahu',
};

export default function ManualEntryTab({ onCreated }: ManualEntryTabProps) {
  const [childName, setChildName] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [attendeeCount, setAttendeeCount] = useState(2);
  const [city, setCity] = useState('');
  const [school, setSchool] = useState('');
  const [major, setMajor] = useState<ManualMajor | ''>('');
  const [status, setStatus] = useState<ManualStatus>('belum_dihubungi');
  const [assignedTo, setAssignedTo] = useState('');
  const [note, setNote] = useState('');
  const [createdAt, setCreatedAt] = useState(() => isoToWibInput(new Date().toISOString()));
  const [attended, setAttended] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<ManualErrors>({});
  const [message, setMessage] = useState('');
  const [savedCode, setSavedCode] = useState('');
  const [copied, setCopied] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || saving) return;

    setSaving(true);
    setMessage('');
    setSavedCode('');
    setCopied(false);

    const createdAtIso = wibInputToIso(createdAt) ?? '';
    const attendedAt = attended ? new Date().toISOString() : '';

    const result = validateManualRegistration({
      child_name: childName,
      parent_name: parentName,
      parent_phone: parentPhone,
      attendee_count: attendeeCount,
      city,
      school,
      interest_major: major,
      followup_status: status,
      assigned_to: assignedTo,
      followup_note: note,
      created_at: createdAtIso,
      attended_at: attendedAt,
    });

    if (!result.ok) {
      setErrors(result.errors);
      setSaving(false);
      return;
    }

    setErrors({});
    const ticketCode = generateTicketCode();
    const payload = buildManualRegistrationPayload(result.value, ticketCode);

    const { data, error } = await supabase
      .from('registrations')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        setMessage(
          error.message.includes('ticket_code')
            ? 'Kode tiket bentrok. Silakan simpan sekali lagi.'
            : 'Pendaftar dengan nomor HP dan nama anak yang sama sudah ada.',
        );
      } else {
        setMessage('Data manual belum tersimpan. Periksa koneksi lalu coba lagi.');
      }
      setSaving(false);
      return;
    }

    const row = data as Registration;
    onCreated(row);
    setSavedCode(ticketCode);
    setMessage('Pendaftar manual berhasil disimpan.');
    setChildName('');
    setParentName('');
    setParentPhone('');
    setCountDefault();
    setNote('');
    setAttended(false);
    setSaving(false);
  }

  function setCountDefault() {
    setAttendeeCount(2);
  }

  async function copyCode() {
    if (!savedCode || typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(savedCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="manual-entry">
      <style>{`
        .manual-entry {
          display: grid;
          gap: 20px;
        }
        .manual-entry__intro {
          max-width: 720px;
        }
        .manual-entry__intro h2 {
          margin: 4px 0 6px;
          color: var(--admin-primary);
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(1.4rem, 3vw, 1.9rem);
        }
        .manual-entry__intro p {
          margin: 0;
          color: var(--admin-text-muted);
          font-size: 0.92rem;
          line-height: 1.55;
        }
        .manual-form {
          display: grid;
          gap: 20px;
        }
        .manual-section {
          display: grid;
          gap: 14px;
          min-width: 0;
          padding: 0;
          border: 0;
        }
        .manual-section legend {
          width: 100%;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--admin-border);
          color: var(--admin-text-muted);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .manual-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .manual-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }
        .manual-field--full {
          grid-column: 1 / -1;
        }
        .manual-field label {
          color: var(--admin-text-main);
          font-size: 0.84rem;
          font-weight: 600;
        }
        .manual-field label span {
          color: var(--admin-text-muted);
          font-weight: 400;
        }
        .manual-field .admin-input,
        .manual-field .admin-select,
        .manual-field .admin-textarea {
          width: 100%;
          min-height: 44px;
          font-size: 1rem;
        }
        .manual-field .admin-textarea {
          min-height: 88px;
        }
        .manual-error {
          margin: 0;
          color: #B91C1C;
          font-size: 0.76rem;
          line-height: 1.4;
        }
        .manual-check {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 44px;
          color: var(--admin-text-main);
          font-size: 0.9rem;
          font-weight: 600;
        }
        .manual-check input {
          width: 18px;
          height: 18px;
          accent-color: var(--admin-accent-dark);
        }
        .manual-submit {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid var(--admin-border);
        }
        .manual-hint {
          margin: 0;
          color: var(--admin-text-muted);
          font-size: 0.78rem;
          line-height: 1.5;
        }
        .manual-success {
          display: grid;
          gap: 8px;
          padding: 14px 16px;
          border: 1px solid #BBF7D0;
          border-radius: var(--radius-md);
          background: #F0FDF4;
          color: #166534;
          font-size: 0.88rem;
        }
        .manual-success strong {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1rem;
        }
        .manual-success__code {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
        }
        .manual-success code {
          padding: 3px 8px;
          border: 1px solid #BBF7D0;
          border-radius: 6px;
          background: #FFFFFF;
          color: #166534;
          font-family: monospace;
          font-size: 0.9rem;
          letter-spacing: 0.04em;
        }
        .manual-success a {
          color: #166534;
          font-weight: 700;
          text-decoration: underline;
        }
        .manual-message {
          margin: 0;
          padding: 10px 12px;
          border: 1px solid #FECACA;
          border-radius: var(--radius-md);
          background: #FEF2F2;
          color: #991B1B;
          font-size: 0.84rem;
          line-height: 1.5;
        }
        @media (max-width: 700px) {
          .manual-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .manual-submit .admin-btn {
            width: 100%;
          }
        }
      `}</style>

      <header className="manual-entry__intro">
        <p className="admin-kicker">Input manual</p>
        <h2>Tambah Pendaftar Manual</h2>
        <p>
          Catat pendaftar dari kertas atau walk-in agar daftar peserta, presensi, dan rekap acara
          tetap sinkron. Pendaftar manual otomatis masuk Kelompok C.
        </p>
      </header>

      <div className="admin-card">
        <form className="manual-form" onSubmit={handleSubmit} noValidate>
          <fieldset className="manual-section">
            <legend>Data anak dan wali</legend>
            <div className="manual-grid">
              <div className="manual-field">
                <label htmlFor="manual-child-name">
                  Nama anak <span>wajib</span>
                </label>
                <input
                  id="manual-child-name"
                  className="admin-input"
                  value={childName}
                  onChange={(event) => setChildName(event.target.value)}
                  maxLength={100}
                  autoComplete="off"
                />
                {errors.child_name && (
                  <p className="manual-error">Nama anak minimal 2 huruf.</p>
                )}
              </div>

              <div className="manual-field">
                <label htmlFor="manual-parent-name">
                  Nama orang tua <span>opsional</span>
                </label>
                <input
                  id="manual-parent-name"
                  className="admin-input"
                  value={parentName}
                  onChange={(event) => setParentName(event.target.value)}
                  maxLength={100}
                  autoComplete="off"
                />
                {errors.parent_name && (
                  <p className="manual-error">Nama orang tua minimal 2 huruf.</p>
                )}
              </div>

              <div className="manual-field">
                <label htmlFor="manual-phone">
                  Nomor HP <span>opsional</span>
                </label>
                <input
                  id="manual-phone"
                  className="admin-input"
                  value={parentPhone}
                  onChange={(event) => setParentPhone(event.target.value)}
                  maxLength={20}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Contoh: 081234567890"
                />
                {errors.parent_phone && (
                  <p className="manual-error">Nomor HP belum sesuai. Contoh: 081234567890.</p>
                )}
              </div>

              <div className="manual-field">
                <label htmlFor="manual-count">Jumlah yang hadir</label>
                <input
                  id="manual-count"
                  className="admin-input"
                  type="number"
                  min={1}
                  max={10}
                  value={attendeeCount}
                  onChange={(event) => setAttendeeCount(Number(event.target.value))}
                />
                {errors.attendee_count && (
                  <p className="manual-error">Pilih jumlah antara 1 dan 10.</p>
                )}
              </div>
            </div>
          </fieldset>

          <fieldset className="manual-section">
            <legend>Asal dan minat</legend>
            <div className="manual-grid">
              <div className="manual-field">
                <label htmlFor="manual-school">
                  Asal sekolah <span>wajib</span>
                </label>
                <input
                  id="manual-school"
                  className="admin-input"
                  value={school}
                  onChange={(event) => setSchool(event.target.value)}
                  maxLength={120}
                  autoComplete="off"
                  placeholder="Contoh: SMP Negeri 1 Subang"
                />
                {errors.school && <p className="manual-error">Asal sekolah wajib diisi.</p>}
              </div>

              <div className="manual-field">
                <label htmlFor="manual-city">
                  Asal kota atau kabupaten <span>wajib</span>
                </label>
                <input
                  id="manual-city"
                  className="admin-input"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  maxLength={80}
                  autoComplete="off"
                  placeholder="Contoh: Subang"
                />
                {errors.city && <p className="manual-error">Asal kota wajib diisi.</p>}
              </div>

              <div className="manual-field">
                <label htmlFor="manual-major">Minat jurusan</label>
                <select
                  id="manual-major"
                  className="admin-select"
                  value={major}
                  onChange={(event) => setMajor(event.target.value as ManualMajor | '')}
                >
                  <option value="">Belum ditentukan</option>
                  {MANUAL_MAJORS.map((value) => (
                    <option key={value} value={value}>
                      {MAJOR_LABELS[value]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="manual-field">
                <label htmlFor="manual-created-at">Waktu daftar di kertas (WIB)</label>
                <input
                  id="manual-created-at"
                  className="admin-input"
                  type="datetime-local"
                  value={createdAt}
                  onChange={(event) => setCreatedAt(event.target.value)}
                />
                {errors.created_at && <p className="manual-error">Waktu daftar belum valid.</p>}
              </div>
            </div>
          </fieldset>

          <fieldset className="manual-section">
            <legend>Tindak lanjut panitia</legend>
            <div className="manual-grid">
              <div className="manual-field">
                <label htmlFor="manual-status">Status tindak lanjut</label>
                <select
                  id="manual-status"
                  className="admin-select"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as ManualStatus)}
                >
                  {MANUAL_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {STATUS_LABELS[value as FollowupStatus]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="manual-field">
                <label htmlFor="manual-assigned">Panitia penanggung jawab</label>
                <input
                  id="manual-assigned"
                  className="admin-input"
                  value={assignedTo}
                  onChange={(event) => setAssignedTo(event.target.value)}
                  maxLength={100}
                  autoComplete="off"
                />
              </div>

              <div className="manual-field manual-field--full">
                <label htmlFor="manual-note">Catatan internal</label>
                <textarea
                  id="manual-note"
                  className="admin-textarea"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={1000}
                  placeholder="Catatan dari kertas atau informasi tambahan."
                />
              </div>
            </div>

            <label className="manual-check" htmlFor="manual-attended">
              <input
                id="manual-attended"
                type="checkbox"
                checked={attended}
                onChange={(event) => setAttended(event.target.checked)}
              />
              Tandai sudah hadir sekarang
            </label>
          </fieldset>

          <div className="manual-submit">
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan pendaftar manual'}
            </button>
            <p className="manual-hint">
              Waktu daftar memengaruhi urutan kelompok. Ubah hanya bila mencatat data kertas dari
              waktu sebelumnya.
            </p>
          </div>

          {message && <p className="manual-message">{message}</p>}

          {savedCode && (
            <div className="manual-success" role="status">
              <strong>Pendaftar manual tersimpan</strong>
              <div className="manual-success__code">
                <span>Kode tiket</span>
                <code>{savedCode}</code>
                <button type="button" className="admin-btn admin-btn--outline" onClick={copyCode}>
                  {copied ? 'Tersalin' : 'Salin'}
                </button>
                <a href={`/e-ticket/${savedCode}`} target="_blank" rel="noopener">
                  Buka tiket
                </a>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

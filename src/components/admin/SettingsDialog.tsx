import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { resolveRegistrationStatus } from '../../lib/settings';
import { formatWib, isoToWibInput, wibInputToIso } from '../../lib/deadline';

const SETTINGS_KEY = 'registration_open';

interface Status {
  open: boolean;
  message: string;
  /** Nilai untuk input `datetime-local`, selalu ditafsirkan sebagai WIB. */
  deadline: string;
  forced: boolean;
}

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

type Notice = { kind: 'success' | 'error'; text: string };

const EMPTY_STATUS: Status = { open: true, message: '', deadline: '', forced: false };

function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
  };
}

function formatRemaining(ms: number): string {
  const { days, hours, minutes, seconds } = splitDuration(ms);
  const clock = [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
  return days > 0 ? `${days} hari ${clock}` : clock;
}

/**
 * Dialog pengaturan pendaftaran.
 *
 * Baca/tulis dilakukan langsung ke Supabase memakai sesi admin yang sudah ada
 * di browser, sehingga otorisasinya sepenuhnya diserahkan ke RLS
 * (`admins_read_settings` / `admins_write_settings` + `public.is_admin()`).
 * Tidak ada route API admin terpisah yang perlu menduplikasi logika sesi.
 *
 * Selain sakelar buka/tutup manual, admin dapat memasang tenggat (countdown).
 * Saat tenggat lewat, status efektif otomatis menjadi tertutup — dihitung oleh
 * `resolveRegistrationStatus`, fungsi yang sama dengan yang dipakai server.
 */
export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<Status>(EMPTY_STATUS);
  const [saved, setSaved] = useState<Status>(EMPTY_STATUS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Selaraskan elemen <dialog> native dengan prop `open`.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  // Detak untuk menghitung sisa waktu dan status otomatis.
  useEffect(() => {
    if (!open) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [open]);

  const load = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      setLoadError('Konfigurasi Supabase belum lengkap.');
      return;
    }

    setLoading(true);
    setLoadError(null);
    setNotice(null);

    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', SETTINGS_KEY)
        .maybeSingle();

      if (error) throw error;

      const value = (data?.value ?? {}) as {
        open?: boolean;
        message?: string | null;
        deadline?: string | null;
        forced?: boolean;
      };
      const next: Status = {
        open: value.open ?? true,
        message: value.message ?? '',
        deadline: isoToWibInput(value.deadline),
        forced: value.forced === true,
      };
      setStatus(next);
      setSaved(next);
    } catch {
      // Tanpa status awal yang pasti, menyimpan bisa menimpa nilai yang benar.
      // Lebih aman menahan penyuntingan sampai data berhasil dimuat.
      setLoadError('Gagal memuat status pendaftaran.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function handleSave() {
    if (!supabase || saving) return;

    setSaving(true);
    setNotice(null);

    const deadlineIso = wibInputToIso(status.deadline);
    const nextValue = {
      open: status.open,
      message: status.message.trim() || null,
      deadline: deadlineIso,
      // `forced` hanya bermakna bila ada tenggat; simpan apa adanya agar
      // status yang tampil di admin sama dengan yang dibaca server.
      forced: status.forced,
    };

    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key: SETTINGS_KEY, value: nextValue }, { onConflict: 'key' });

      if (error) throw error;

      const next: Status = {
        open: nextValue.open,
        message: nextValue.message ?? '',
        deadline: isoToWibInput(nextValue.deadline),
        forced: nextValue.forced,
      };
      setStatus(next);
      setSaved(next);
      setNotice({ kind: 'success', text: 'Pengaturan tersimpan.' });
    } catch {
      setNotice({ kind: 'error', text: 'Gagal menyimpan. Periksa koneksi lalu coba lagi.' });
    } finally {
      setSaving(false);
    }
  }

  const deadlineIso = wibInputToIso(status.deadline);
  const effective = resolveRegistrationStatus(
    {
      open: status.open,
      message: status.message,
      deadline: deadlineIso,
      forced: status.forced,
    },
    new Date(nowMs),
  );
  const deadlineMs = deadlineIso ? Date.parse(deadlineIso) : null;
  const remainingMs = deadlineMs !== null ? Math.max(0, deadlineMs - nowMs) : null;
  const expired = remainingMs === 0;

  const statusLabel = !status.open
    ? 'Pendaftaran ditutup manual'
    : expired && !status.forced
      ? 'Ditutup otomatis — tenggat lewat'
      : expired && status.forced
        ? 'Dibuka manual — tenggat diabaikan'
        : 'Pendaftaran dibuka';

  const dirty =
    status.open !== saved.open ||
    status.forced !== saved.forced ||
    status.deadline !== saved.deadline ||
    status.message.trim() !== saved.message.trim();

  return (
    <dialog
      ref={dialogRef}
      className="admin-dialog"
      aria-labelledby="settings-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        // Klik pada area backdrop (target = elemen <dialog> itu sendiri).
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="admin-dialog__card">
        <header className="admin-dialog__head">
          <div>
            <h2 className="admin-dialog__title" id="settings-dialog-title">
              Pengaturan Pendaftaran
            </h2>
            <p className="admin-dialog__desc">
              Atur buka/tutup formulir, pasang tenggat countdown, dan tentukan pesan yang tampil
              saat pendaftaran ditutup.
            </p>
          </div>
          <button
            type="button"
            className="admin-dialog__close"
            onClick={onClose}
            aria-label="Tutup pengaturan"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </header>

        <div className="admin-dialog__body">
          {loading ? (
            <>
              <div className="admin-dialog__skeleton" style={{ width: '45%' }} />
              <div className="admin-dialog__skeleton" style={{ width: '100%', height: 28 }} />
              <div className="admin-dialog__skeleton" style={{ width: '70%' }} />
            </>
          ) : loadError ? (
            <div>
              <p className="admin-dialog__notice admin-dialog__notice--error" role="alert">
                {loadError}
              </p>
              <button
                type="button"
                className="admin-btn admin-btn--outline"
                style={{ marginTop: 12 }}
                onClick={() => void load()}
              >
                Coba lagi
              </button>
            </div>
          ) : (
            <>
              {notice && (
                <p
                  className={`admin-dialog__notice admin-dialog__notice--${notice.kind}`}
                  role={notice.kind === 'error' ? 'alert' : 'status'}
                >
                  {notice.text}
                </p>
              )}

              <div>
                <div
                  className={`admin-dialog__status ${
                    effective.open
                      ? 'admin-dialog__status--open'
                      : 'admin-dialog__status--closed'
                  }`}
                >
                  <span className="admin-dialog__dot" aria-hidden="true" />
                  {statusLabel}
                </div>

                {effective.open && deadlineMs !== null && remainingMs !== null && (
                  <p className="admin-hint" style={{ marginTop: 8 }}>
                    Sisa waktu: <strong>{formatRemaining(remainingMs)}</strong>
                    {deadlineIso ? ` · berakhir ${formatWib(deadlineIso)}` : ''}
                  </p>
                )}

                <label className="admin-switch" style={{ marginTop: 14 }}>
                  <input
                    type="checkbox"
                    name="open"
                    checked={status.open}
                    onChange={(event) => {
                      const nextOpen = event.target.checked;
                      setStatus((current) => ({
                        ...current,
                        open: nextOpen,
                        // Menyalakan sakelar saat tenggat sudah lewat berarti
                        // admin memang ingin membuka paksa.
                        forced: nextOpen && expired ? true : current.forced,
                      }));
                      setNotice(null);
                    }}
                    disabled={saving}
                    autoFocus
                  />
                  <span className="admin-switch__track" aria-hidden="true" />
                  <span className="admin-switch__label">
                    {status.open ? 'Formulir menerima pendaftaran' : 'Formulir ditutup'}
                  </span>
                </label>

                <p className="admin-hint">
                  {!status.open
                    ? 'Pengunjung masih dapat membuka formulir, tetapi tidak bisa mengirim pendaftaran.'
                    : expired && !status.forced
                      ? 'Tenggat sudah lewat, jadi formulir otomatis tertutup. Nyalakan kembali sakelar di atas untuk membuka paksa.'
                      : 'Pengunjung dapat mengisi dan mengirim formulir seperti biasa.'}
                </p>
              </div>

              <div>
                <label className="admin-label" htmlFor="settings-deadline">
                  Tenggat pendaftaran (countdown)
                </label>
                <input
                  id="settings-deadline"
                  name="deadline"
                  type="datetime-local"
                  className="admin-input admin-input--block"
                  value={status.deadline}
                  onChange={(event) => {
                    const deadline = event.target.value;
                    setStatus((current) => ({
                      ...current,
                      deadline,
                      // Tenggat baru harus dihitung ulang, bukan diabaikan
                      // oleh mode buka-paksa dari tenggat sebelumnya.
                      forced: false,
                    }));
                    setNotice(null);
                  }}
                  disabled={saving}
                />
                <p className="admin-hint">
                  Waktu mengikuti <strong>WIB</strong>. Formulir menutup otomatis saat tenggat
                  lewat. Kosongkan bila tidak memakai countdown.
                </p>
                {status.deadline && (
                  <button
                    type="button"
                    className="admin-btn admin-btn--outline"
                    style={{ marginTop: 8 }}
                    onClick={() => {
                      setStatus((current) => ({ ...current, deadline: '', forced: false }));
                      setNotice(null);
                    }}
                    disabled={saving}
                  >
                    Hapus tenggat
                  </button>
                )}
              </div>

              {expired && (
                <div>
                  <label className="admin-switch">
                    <input
                      type="checkbox"
                      name="forced"
                      checked={status.forced}
                      onChange={(event) => {
                        const forced = event.target.checked;
                        setStatus((current) => ({ ...current, forced }));
                        setNotice(null);
                      }}
                      disabled={saving}
                    />
                    <span className="admin-switch__track" aria-hidden="true" />
                    <span className="admin-switch__label">
                      Abaikan tenggat &amp; buka manual
                    </span>
                  </label>
                  <p className="admin-hint">
                    Tenggat tetap tersimpan, tetapi formulir dibuka kembali sampai Anda
                    mematikannya. Berguna untuk menerima pendaftaran terlambat.
                  </p>
                </div>
              )}

              <div>
                <label className="admin-label" htmlFor="settings-message">
                  Pesan saat ditutup <span style={{ fontWeight: 400, color: '#64748B' }}>(opsional)</span>
                </label>
                <textarea
                  id="settings-message"
                  name="message"
                  className="admin-textarea"
                  rows={3}
                  value={status.message}
                  maxLength={300}
                  placeholder="Contoh: Pendaftaran ditutup sementara dan dibuka kembali 1 November 2026."
                  onChange={(event) => {
                    const message = event.target.value;
                    setStatus((current) => ({ ...current, message }));
                    setNotice(null);
                  }}
                  disabled={saving}
                />
                <p className="admin-hint">
                  Hanya tampil pada formulir publik ketika pendaftaran ditutup. Kosongkan untuk
                  memakai pesan bawaan.
                </p>
              </div>
            </>
          )}
        </div>

        <footer className="admin-dialog__foot">
          <div className="admin-dialog__foot-actions">
            <button
              type="button"
              className="admin-btn admin-btn--outline"
              onClick={onClose}
              disabled={saving}
            >
              Batal
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={handleSave}
              disabled={loading || saving || !!loadError || !dirty}
            >
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
          </div>
        </footer>
      </div>
    </dialog>
  );
}

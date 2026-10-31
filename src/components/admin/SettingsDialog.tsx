import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const SETTINGS_KEY = 'registration_open';

interface Status {
  open: boolean;
  message: string;
}

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

type Notice = { kind: 'success' | 'error'; text: string };

/**
 * Dialog pengaturan pendaftaran.
 *
 * Baca/tulis dilakukan langsung ke Supabase memakai sesi admin yang sudah ada
 * di browser, sehingga otorisasinya sepenuhnya diserahkan ke RLS
 * (`admins_read_settings` / `admins_write_settings` + `public.is_admin()`).
 * Tidak ada route API admin terpisah yang perlu menduplikasi logika sesi.
 */
export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<Status>({ open: true, message: '' });
  const [saved, setSaved] = useState<Status>({ open: true, message: '' });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Selaraskan elemen <dialog> native dengan prop `open`.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
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

      const value = (data?.value ?? {}) as { open?: boolean; message?: string | null };
      const next: Status = { open: value.open ?? true, message: value.message ?? '' };
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

    const nextValue = {
      open: status.open,
      message: status.message.trim() || null,
    };

    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key: SETTINGS_KEY, value: nextValue }, { onConflict: 'key' });

      if (error) throw error;

      const next: Status = { open: nextValue.open, message: nextValue.message ?? '' };
      setStatus(next);
      setSaved(next);
      setNotice({ kind: 'success', text: 'Pengaturan tersimpan.' });
    } catch {
      setNotice({ kind: 'error', text: 'Gagal menyimpan. Periksa koneksi lalu coba lagi.' });
    } finally {
      setSaving(false);
    }
  }

  const dirty = status.open !== saved.open || status.message.trim() !== saved.message.trim();

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
              Tentukan apakah formulir pendaftaran bisa diisi pengunjung saat ini.
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
                    status.open ? 'admin-dialog__status--open' : 'admin-dialog__status--closed'
                  }`}
                >
                  <span className="admin-dialog__dot" aria-hidden="true" />
                  {status.open ? 'Pendaftaran dibuka' : 'Pendaftaran ditutup'}
                </div>

                <label className="admin-switch" style={{ marginTop: 14 }}>
                  <input
                    type="checkbox"
                    name="open"
                    checked={status.open}
                    onChange={(event) => {
                      const open = event.target.checked;
                      setStatus((current) => ({ ...current, open }));
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
                  {status.open
                    ? 'Pengunjung dapat mengisi dan mengirim formulir seperti biasa.'
                    : 'Pengunjung masih dapat membuka formulir, tetapi tidak bisa mengirim pendaftaran.'}
                </p>
              </div>

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

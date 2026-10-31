import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface RegistrationStatus {
  open: boolean;
  message: string | null;
}

interface SettingsTabProps {
  onClose: () => void;
}

export default function SettingsTab({ onClose }: SettingsTabProps) {
  const [status, setStatus] = useState<RegistrationStatus>({ open: true, message: null });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/registration-status', {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Gagal memuat status');
      const data = await res.json();
      setStatus({ open: data.open ?? true, message: data.message ?? null });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const open = formData.get('open') === 'on';
    const message = formData.get('message')?.toString().trim() || null;

    try {
      const res = await fetch('/api/admin/registration-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ open, message }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan');
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      fetchStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-settings">
      <header className="admin-settings__header">
        <h2>Pengaturan Pendaftaran</h2>
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={onClose}
          aria-label="Kembali ke dasbor"
        >
          ← Kembali
        </button>
      </header>

      {saved && (
        <motion.div
          className="admin-toast admin-toast--success"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          ✓ Pengaturan tersimpan
        </motion.div>
      )}

      {error && (
        <motion.div
          className="admin-toast admin-toast--error"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          ✕ {error}
        </motion.div>
      )}

      <form onSubmit={handleSave} className="admin-settings__form">
        <fieldset className="admin-fieldset">
          <legend>Status Pendaftaran</legend>

          <label className="admin-switch">
            <input
              type="checkbox"
              name="open"
              checked={status.open}
              disabled={saving}
            />
            <span className="admin-switch__track" aria-hidden="true">
              <span className="admin-switch__thumb" />
            </span>
            <span className="admin-switch__label">
              {status.open ? 'Dibuka' : 'Ditutup'}
            </span>
          </label>

          <p className="admin-hint">
            {status.open
              ? 'Form pendaftaran dapat diakses dan diisi oleh calon peserta.'
              : 'Form pendaftaran tidak dapat diisi. Peserta akan melihat pesan peringatan.'}
          </p>
        </fieldset>

        <fieldset className="admin-fieldset">
          <legend>Pesan Khusus (Opsional)</legend>
          <textarea
            name="message"
            value={status.message ?? ''}
            placeholder="Kosongkan untuk pakai pesan default. Contoh: Pendaftaran ditutup sampai 1 November 2026."
            rows={3}
            disabled={saving || status.open}
            className="admin-textarea"
            aria-describedby="message-hint"
          />
          <p id="message-hint" className="admin-hint">
            {status.open
              ? 'Pesan hanya ditampilkan saat pendaftaran ditutup. Aktifkan "Ditutup" terlebih dahulu.'
              : 'Pesan ini akan ditampilkan di banner peringatan pada form pendaftaran.'}
          </p>
        </fieldset>

        <div className="admin-settings__actions">
          <button
            type="submit"
            className="admin-btn admin-btn--primary"
            disabled={saving}
          >
            {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}
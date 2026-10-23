// src/components/admin/DetailScreen.tsx
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { content } from '../../config/content';
import { STATUS_LABELS } from './types';
import type { Registration, FollowupStatus } from './types';

interface DetailScreenProps {
  registration: Registration;
  onBack: () => void;
  onUpdateRow: (r: Registration) => void;
}

export default function DetailScreen({ registration: initial, onBack, onUpdateRow }: DetailScreenProps) {
  const [reg, setReg] = useState(initial);
  const [status, setStatus] = useState<FollowupStatus>(initial.followup_status);
  const [assignedTo, setAssignedTo] = useState(initial.assigned_to ?? '');
  const [note, setNote] = useState(initial.followup_note ?? '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  async function handleSave() {
    if (!supabase) return;
    setSaving(true);
    setSaveMsg('');
    
    const { error } = await supabase
      .from('registrations')
      .update({
        followup_status: status,
        assigned_to: assignedTo || null,
        followup_note: note || null,
      })
      .eq('id', reg.id);
      
    setSaving(false);
    
    if (!error) {
      const updated = {
        ...reg,
        followup_status: status,
        assigned_to: assignedTo || null,
        followup_note: note || null,
      };
      setReg(updated);
      onUpdateRow(updated);
      setSaveMsg('Pembaruan data berhasil disimpan.');
      
      setTimeout(() => setSaveMsg(''), 3000);
    } else {
      setSaveMsg('Sistem gagal menyimpan perubahan.');
    }
  }

  async function toggleAttendance() {
    if (!supabase) return;
    setSaving(true);
    setSaveMsg('');
    
    const nextAttended = reg.attended_at ? null : new Date().toISOString();
    const { error } = await supabase
      .from('registrations')
      .update({ attended_at: nextAttended })
      .eq('id', reg.id);
      
    setSaving(false);
    
    if (!error) {
      const updated = { ...reg, attended_at: nextAttended };
      setReg(updated);
      onUpdateRow(updated);
      setSaveMsg(nextAttended ? 'Status kehadiran berhasil dicatat.' : 'Status kehadiran berhasil dibatalkan.');
      setTimeout(() => setSaveMsg(''), 3000);
    } else {
      setSaveMsg('Sistem gagal memperbarui status kehadiran.');
    }
  }

  function buildWaMessage() {
    const sapaan = reg.parent_name
      ? `Bapak atau Ibu ${reg.parent_name}`
      : `Wali dari ${reg.child_name}`;
      
    return content.waMessage.greeting
      .replace('{sapaan}', sapaan)
      .replace('{nama anak}', reg.child_name);
  }

  function handleChatWa() {
    const nomor = reg.parent_phone.replace('+', '');
    const pesan = encodeURIComponent(buildWaMessage());
    window.open(`https://wa.me/${nomor}?text=${pesan}`, '_blank', 'noopener');
  }

  return (
    <>
      <style>{`
        .admin-detail-layout {
          display: grid;
          gap: 24px;
        }

        @media (min-width: 860px) {
          .admin-detail-layout {
            grid-template-columns: 1.4fr 1fr;
            align-items: start;
          }
        }

        .admin-data-group {
          margin-bottom: 28px;
        }
        
        .admin-data-group:last-child {
          margin-bottom: 0;
        }

        .admin-data-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
          color: var(--admin-text-muted);
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--admin-border);
        }

        .admin-data-list {
          display: grid;
          gap: 16px;
        }

        @media (min-width: 500px) {
          .admin-data-list--split {
            grid-template-columns: 1fr 1fr;
          }
        }

        .admin-data-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .admin-data-label {
          font-size: 0.85rem;
          color: var(--admin-text-muted);
          font-weight: 600;
        }

        .admin-data-value {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--admin-primary);
          word-break: break-word;
        }

        .admin-form-block {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .admin-form-block label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--admin-text-main);
        }
        
        .admin-action-stack {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid var(--admin-border);
        }
      `}</style>

      <div className="admin-wrap">
        <header className="admin-header">
          <div className="admin-header__brand" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
            <button className="admin-btn admin-btn--outline" onClick={onBack} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              Kembali Ke Dasbor
            </button>
            <h1>Profil Pendaftar</h1>
          </div>
        </header>

        <div className="admin-detail-layout">
          
          {/* KOLOM KIRI: Data Pendaftar */}
          <div className="admin-card">
            
            <div className="admin-data-group">
              <div className="admin-data-title">Status Kedatangan</div>
              <div className="admin-data-list">
                <div className="admin-data-item">
                  <div className="admin-data-label">Kehadiran Fisik</div>
                  <div className="admin-data-value">
                    {reg.attended_at ? (
                      <span className="badge badge--success">
                        Hadir Pukul {new Date(reg.attended_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                    ) : (
                      <span className="badge badge--neutral">Belum Hadir</span>
                    )}
                  </div>
                </div>
                <div className="admin-data-item">
                  <div className="admin-data-label">Kode Tiket</div>
                  <div className="admin-data-value">
                    <span className="admin-code">{reg.ticket_code || 'Belum Terbit'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-data-group">
              <div className="admin-data-title">Data Keluarga</div>
              <div className="admin-data-list admin-data-list--split">
                <div className="admin-data-item">
                  <div className="admin-data-label">Nama Calon Siswa</div>
                  <div className="admin-data-value">{reg.child_name}</div>
                </div>
                <div className="admin-data-item">
                  <div className="admin-data-label">Nama Orang Tua</div>
                  <div className="admin-data-value">{reg.parent_name || 'Tidak Disebutkan'}</div>
                </div>
                <div className="admin-data-item">
                  <div className="admin-data-label">Nomor WhatsApp</div>
                  <div className="admin-data-value">{reg.parent_phone}</div>
                </div>
                <div className="admin-data-item">
                  <div className="admin-data-label">Total Rombongan</div>
                  <div className="admin-data-value">{reg.attendee_count} Orang</div>
                </div>
              </div>
            </div>

            <div className="admin-data-group">
              <div className="admin-data-title">Riwayat Pendidikan</div>
              <div className="admin-data-list admin-data-list--split">
                <div className="admin-data-item">
                  <div className="admin-data-label">Asal Sekolah</div>
                  <div className="admin-data-value">{reg.school}</div>
                </div>
                <div className="admin-data-item">
                  <div className="admin-data-label">Asal Kota</div>
                  <div className="admin-data-value">{reg.city}</div>
                </div>
                <div className="admin-data-item">
                  <div className="admin-data-label">Minat Jurusan</div>
                  <div className="admin-data-value">{reg.interest_major || 'Belum Menentukan'}</div>
                </div>
              </div>
            </div>

            <div className="admin-data-group">
              <div className="admin-data-title">Referensi Sistem</div>
              <div className="admin-data-list admin-data-list--split">
                <div className="admin-data-item">
                  <div className="admin-data-label">Waktu Pendaftaran</div>
                  <div className="admin-data-value">
                    {new Date(reg.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                  </div>
                </div>
                <div className="admin-data-item">
                  <div className="admin-data-label">Sumber Kedatangan</div>
                  <div className="admin-data-value">{reg.utm_source || 'Akses Langsung'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: Tindak Lanjut Panitia */}
          <div className="admin-card">
            <div className="admin-card__header">
              <h2>Tindak Lanjut Panitia</h2>
              <p>Kelola status kedatangan dan proses komunikasi dengan wali murid.</p>
            </div>
            
            <div className="admin-form-block" style={{ marginBottom: '28px' }}>
              <button
                type="button"
                className={`admin-btn ${reg.attended_at ? 'admin-btn--outline' : 'admin-btn--primary'}`}
                onClick={toggleAttendance}
                disabled={saving}
              >
                {reg.attended_at ? 'Batalkan Presensi' : 'Tandai Hadir'}
              </button>
            </div>

            <div className="admin-form-block">
              <label>Tahap Percakapan</label>
              <select 
                className="admin-select" 
                value={status} 
                onChange={(e) => setStatus(e.target.value as FollowupStatus)}
              >
                {(Object.keys(STATUS_LABELS) as FollowupStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>

            <div className="admin-form-block">
              <label>Panitia Penanggung Jawab</label>
              <input
                type="text"
                className="admin-input"
                placeholder="Ketik nama panitia pelaksana"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="admin-form-block">
              <label>Catatan Internal</label>
              <textarea
                className="admin-input"
                style={{ resize: 'vertical', minHeight: '100px' }}
                placeholder="Ketik hasil diskusi atau pertanyaan titipan dari wali murid disini..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={1000}
              />
            </div>
            
            <div className="admin-action-stack">
              <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Proses Menyimpan...' : 'Simpan Pembaruan'}
              </button>
              <button 
                className="admin-btn" 
                style={{ backgroundColor: '#16A34A', color: '#FFF' }} 
                onClick={handleChatWa}
              >
                Hubungi Lewat WhatsApp
              </button>
            </div>
            
            {saveMsg && (
              <div className="admin-alert admin-alert--success" style={{ marginTop: '16px', textAlign: 'center' }}>
                {saveMsg}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
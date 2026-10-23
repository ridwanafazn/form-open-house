// src/components/admin/ScannerTab.tsx
import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../../lib/supabaseClient';
import type { Registration } from './types';

interface ScannerTabProps {
  rows: Registration[];
  onCheckInSuccess: (id: string, attendedAt: string) => void;
  onSelectRegistration: (r: Registration) => void;
}

export default function ScannerTab({ rows, onCheckInSuccess, onSelectRegistration }: ScannerTabProps) {
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // State untuk limit aktivitas
  const [activityLimit, setActivityLimit] = useState<number>(5);

  const [scanResult, setScanResult] = useState<{
    type: 'success' | 'duplicate' | 'error';
    message: string;
    item?: Registration;
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'admin-qr-reader';

  async function handleProcessCode(rawCode: string) {
    if (processing) return;
    const code = rawCode.trim();
    if (!code) return;

    setProcessing(true);

    let cleanCode = code;
    try {
      if (code.startsWith('http://') || code.startsWith('https://')) {
        const u = new URL(code);
        cleanCode = u.searchParams.get('scan') || u.searchParams.get('code') || code;
      }
    } catch {
      // Abaikan jika gagal parse URL
    }

    let target = rows.find(
      (r) =>
        (r.ticket_code && r.ticket_code.toLowerCase() === cleanCode.toLowerCase()) ||
        r.id === cleanCode ||
        r.parent_phone.includes(cleanCode),
    );

    if (!target && supabase) {
      const { data } = await supabase
        .from('registrations')
        .select('*')
        .or(`ticket_code.eq.${cleanCode},id.eq.${cleanCode}`)
        .maybeSingle();
      if (data) target = data as Registration;
    }

    if (!target) {
      setScanResult({
        type: 'error',
        message: `Tiket atau Kontak "${cleanCode}" tidak ditemukan dalam sistem kami.`,
      });
      setProcessing(false);
      return;
    }

    if (target.attended_at) {
      const jam = new Date(target.attended_at).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setScanResult({
        type: 'duplicate',
        message: `${target.child_name} dari ${target.school} sudah tercatat hadir sebelumnya pada pukul ${jam} WIB.`,
        item: target,
      });
      setProcessing(false);
      return;
    }

    const now = new Date().toISOString();
    if (supabase) {
      await supabase.from('registrations').update({ attended_at: now }).eq('id', target.id);
    }
    const updated = { ...target, attended_at: now };
    onCheckInSuccess(target.id, now);
    
    setScanResult({
      type: 'success',
      message: `${target.child_name} (${target.school}) berhasil Check-in. Total rombongan: ${target.attendee_count} Orang.`,
      item: updated,
    });
    setManualCode('');
    setProcessing(false);
  }

  async function startCamera() {
    setCameraError('');
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerElementId);
      }
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => handleProcessCode(decodedText),
        () => {}
      );
      setIsScanning(true);
    } catch (err) {
      console.error('Kamera gagal dibuka:', err);
      setCameraError('Kamera tidak dapat diakses. Pastikan izin kamera telah disetujui di browser.');
      setIsScanning(false);
    }
  }

  async function stopCamera() {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Kamera stop error:', err);
      }
      setIsScanning(false);
    }
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const recentlyAttended = rows
    .filter((r) => !!r.attended_at)
    .sort((a, b) => (b.attended_at! > a.attended_at! ? 1 : -1))
    .slice(0, activityLimit === -1 ? rows.length : activityLimit);

  return (
    <>
      {/* CSS Injeksi Khusus untuk Scanner & Modal Pop-up */}
      <style>{`
        /* Modal Overlay */
        .oh-modal-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background-color: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: ohFadeIn 0.2s ease;
        }
        .oh-modal-card {
          background: #FFFFFF; width: 100%; max-width: 420px;
          border-radius: 20px; padding: 32px 24px; text-align: center;
          position: relative; box-shadow: 0 20px 40px rgba(0,0,0,0.15);
          animation: ohSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .oh-modal-close {
          position: absolute; top: 16px; right: 16px;
          background: #F1F5F9; border: none; width: 32px; height: 32px;
          border-radius: 50%; font-size: 1.1rem; display: flex;
          align-items: center; justify-content: center;
          color: #64748B; cursor: pointer; transition: all 0.2s;
        }
        .oh-modal-close:hover { background: #E2E8F0; color: #0F172A; }
        
        /* Ikon Modal */
        .oh-modal-icon {
          width: 72px; height: 72px; border-radius: 50%;
          margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;
          font-size: 2.2rem; font-weight: bold;
        }
        .oh-modal--success .oh-modal-icon { background: #DCFCE7; color: #166534; }
        .oh-modal--duplicate .oh-modal-icon { background: #FFFBEB; color: #92400E; }
        .oh-modal--error .oh-modal-icon { background: #FEF2F2; color: #991B1B; }
        
        /* Teks & Tombol Modal */
        .oh-modal-body h3 { font-family: 'Space Grotesk', sans-serif; margin: 0 0 8px; color: #0F172A; font-size: 1.5rem; }
        .oh-modal-body p { color: #475569; font-size: 0.95rem; margin: 0 0 24px; line-height: 1.5; }
        .oh-modal-action { width: 100%; padding: 14px; font-size: 1rem; border-radius: 12px; }

        /* Area Scroll Aktivitas */
        .admin-activity-scroll {
          max-height: 440px; /* Pas untuk 5 item tanpa scroll */
          overflow-y: auto;
          padding-right: 8px;
        }
        
        /* Kustomisasi Scrollbar Minimalis */
        .admin-activity-scroll::-webkit-scrollbar { width: 6px; }
        .admin-activity-scroll::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 10px; }
        .admin-activity-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .admin-activity-scroll::-webkit-scrollbar-thumb:hover { background: #94A3B8; }

        @keyframes ohFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ohSlideUp { from { opacity: 0; transform: translateY(20px); scale: 0.95; } to { opacity: 1; transform: translateY(0); scale: 1; } }
      `}</style>

      {/* MODAL POP-UP (Hanya dirender jika ada hasil scan) */}
      {scanResult && (
        <div className="oh-modal-overlay" onClick={() => setScanResult(null)}>
          <div 
            className={`oh-modal-card oh-modal--${scanResult.type}`} 
            onClick={(e) => e.stopPropagation()} /* Mencegah modal tertutup jika klik bagian dalam card */
          >
            <button className="oh-modal-close" onClick={() => setScanResult(null)}>✕</button>
            <div className="oh-modal-icon">
              {scanResult.type === 'success' && '✓'}
              {scanResult.type === 'duplicate' && '!'}
              {scanResult.type === 'error' && '✕'}
            </div>
            <div className="oh-modal-body">
              <h3>
                {scanResult.type === 'success' && 'Presensi Berhasil'}
                {scanResult.type === 'duplicate' && 'Sudah Pernah Hadir'}
                {scanResult.type === 'error' && 'Tiket Tidak Valid'}
              </h3>
              <p>{scanResult.message}</p>
              {scanResult.item && (
                <button
                  type="button"
                  className="admin-btn admin-btn--primary oh-modal-action"
                  onClick={() => {
                    setScanResult(null);
                    onSelectRegistration(scanResult.item!);
                  }}
                >
                  Buka Detail Pendaftar →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <section className="admin-scanner-tab" id="scan">
        <div className="admin-scanner-grid">
          
          {/* Kolom Kiri: Kamera Scanner */}
          <div className="admin-card">
            <div className="admin-card__header">
              <h2>Pemindai QR Code</h2>
              <p>Arahkan kamera ke E-Ticket pendaftar untuk mempercepat check-in.</p>
            </div>

            <div className="admin-scanner-controls">
              {!isScanning ? (
                <button type="button" className="admin-btn admin-btn--primary" onClick={startCamera}>
                  Nyalakan Kamera Scanner
                </button>
              ) : (
                <button type="button" className="admin-btn admin-btn--outline" onClick={stopCamera}>
                  Tutup Kamera
                </button>
              )}
            </div>

            {cameraError && <p className="admin-msg admin-msg--error">{cameraError}</p>}

            <div
              id={readerElementId}
              className={`admin-reader-box ${isScanning ? 'admin-reader-box--active' : ''}`}
            />

            <div className="admin-manual-divider">Atau Input Manual</div>

            <form
              className="admin-manual-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessCode(manualCode);
              }}
            >
              <div className="admin-manual-input-wrap">
                <input
                  id="manual-ticket-input"
                  type="text"
                  className="admin-input"
                  placeholder="Ketikan Kode Tiket (OH-...) / No HP"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                />
                <button type="submit" className="admin-btn admin-btn--primary" disabled={processing || !manualCode.trim()}>
                  Check-in
                </button>
              </div>
            </form>
          </div>

          {/* Kolom Kanan: Aktivitas Presensi (Bisa Di-Scroll & Diatur Limitnya) */}
          <div className="admin-card">
            <div className="admin-card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <h2>Aktivitas Terbaru</h2>
                <p>Riwayat check-in keluarga di lokasi.</p>
              </div>
              <select
                className="admin-select"
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                value={activityLimit}
                onChange={(e) => setActivityLimit(Number(e.target.value))}
              >
                <option value={5}>5 Terakhir</option>
                <option value={10}>10 Terakhir</option>
                <option value={20}>20 Terakhir</option>
                <option value={50}>50 Terakhir</option>
                <option value={-1}>Semua Data</option>
              </select>
            </div>

            {recentlyAttended.length === 0 ? (
              <div className="admin-empty-state">
                <p>Belum ada riwayat check-in hari ini.</p>
              </div>
            ) : (
              <div className="admin-activity-scroll">
                <div className="admin-activity-list">
                  {recentlyAttended.map((item) => (
                    <div
                      key={item.id}
                      className="admin-activity-item"
                      onClick={() => onSelectRegistration(item)}
                      tabIndex={0}
                    >
                      <div className="admin-activity-time">
                        {new Date(item.attended_at!).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="admin-activity-body">
                        <div className="admin-activity-title">
                          <strong>{item.child_name}</strong>
                          <span className="admin-activity-count">+{item.attendee_count} Org</span>
                        </div>
                        <div className="admin-activity-meta">
                          {item.school} <span className="admin-activity-dot">•</span> {item.ticket_code}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
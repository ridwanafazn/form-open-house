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
    type: 'success' | 'duplicate' | 'cancelled' | 'error';
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
        (r.parent_phone?.includes(cleanCode) ?? false),
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

    // Pendaftar yang sudah berstatus tidak jadi tidak boleh masuk hitungan
    // kehadiran. Tolak sebelum cek duplikat agar tiket tidak pernah tercatat.
    if (target.followup_status === 'tidak_jadi') {
      setScanResult({
        type: 'cancelled',
        message: `${target.child_name} berstatus Tidak jadi. Tiket tidak dapat discan. Hubungi panitia jika status pendaftar berubah.`,
        item: target,
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
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.7);
            return { width: edge, height: edge };
          },
        },
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

  const scanResultTitle = scanResult
    ? {
        success: 'Berhasil check-in',
        duplicate: 'Sudah pernah check-in',
        cancelled: 'Pendaftar berstatus tidak jadi',
        error: 'Kode tidak ditemukan',
      }[scanResult.type]
    : '';

  return (
    <>
      <style>{`
        /* Area Scroll Aktivitas */
        .admin-activity-scroll {
          max-height: 440px;
          overflow-y: auto;
          padding-right: 8px;
        }

        /* Kustomisasi Scrollbar Minimalis */
        .admin-activity-scroll::-webkit-scrollbar { width: 6px; }
        .admin-activity-scroll::-webkit-scrollbar-track { background: #F1F5F9; border-radius: 10px; }
        .admin-activity-scroll::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .admin-activity-scroll::-webkit-scrollbar-thumb:hover { background: #94A3B8; }

        /* Hasil scan tampil inline agar petugas bisa scan berulang tanpa menutup modal. */
        .admin-scan-result {
          display: grid;
          gap: 8px;
          margin-top: 16px;
          padding: 12px 14px;
          border: 1px solid var(--admin-border);
          border-left: 4px solid #64748B;
          border-radius: 10px;
          background: #F8FAFC;
        }
        .admin-scan-result--success { border-left-color: #059669; background: #F0FDF4; }
        .admin-scan-result--duplicate { border-left-color: #D97706; background: #FFFBEB; }
        .admin-scan-result--cancelled,
        .admin-scan-result--error { border-left-color: #DC2626; background: #FEF2F2; }
        .admin-scan-result__head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .admin-scan-result__head strong {
          color: var(--admin-primary);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 0.95rem;
        }
        .admin-scan-result p {
          margin: 0;
          color: var(--admin-text-main);
          font-size: 0.86rem;
          line-height: 1.5;
        }
        .admin-scan-result__close {
          flex: none;
          padding: 2px 4px;
          border: 0;
          background: transparent;
          color: var(--admin-text-muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
        }
        .admin-scan-result__action {
          justify-self: start;
          margin-top: 4px;
        }
      `}</style>

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
                  placeholder="Ketik kode tiket (OH-...) atau nomor HP"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  aria-label="Kode tiket atau nomor HP"
                />
                <button type="submit" className="admin-btn admin-btn--primary" disabled={processing || !manualCode.trim()}>
                  Check-in
                </button>
              </div>
            </form>

            {scanResult && (
              <div
                className={`admin-scan-result admin-scan-result--${scanResult.type}`}
                role="status"
                aria-live="polite"
              >
                <div className="admin-scan-result__head">
                  <strong>{scanResultTitle}</strong>
                  <button
                    type="button"
                    className="admin-scan-result__close"
                    onClick={() => setScanResult(null)}
                  >
                    Tutup
                  </button>
                </div>
                <p>{scanResult.message}</p>
                {scanResult.item && (
                  <button
                    type="button"
                    className="admin-btn admin-btn--outline admin-scan-result__action"
                    onClick={() => {
                      const item = scanResult.item!;
                      setScanResult(null);
                      onSelectRegistration(item);
                    }}
                  >
                    Buka detail pendaftar
                  </button>
                )}
              </div>
            )}
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
import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface SummaryData {
  child_name: string;
  attendee_count: number;
  ticket_code?: string;
  id?: string;
  parent_phone?: string;
}

const STORAGE_SUMMARY_KEY = 'oh_summary';

export default function TicketCard() {
  const [data, setData] = useState<SummaryData | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_SUMMARY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SummaryData;
        setData(parsed);
      }
    } catch {
      setData(null);
    }
  }, []);

  const ticketCode = data?.ticket_code || 'OH-TICKET';

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(
      canvasRef.current,
      ticketCode,
      {
        width: 200,
        margin: 2,
        color: {
          dark: '#1c1c1a',
          light: '#ffffff',
        },
      },
      (err) => {
        if (err) console.error('Gagal membuat QR Code:', err);
      },
    );
  }, [ticketCode, data]);

  function buildTicketMessage() {
    const child = data?.child_name || 'Calon Siswa';
    const count = data?.attendee_count || 1;
    return `Assalamualaikum. Ini adalah bukti pendaftaran dan tiket masuk Open House SMKIT As Syifa Boarding School untuk calon siswa: ${child} (Jumlah hadir: ${count} orang). Kode Tiket: ${ticketCode}. Tunjukkan pesan atau QR Code ini kepada panitia di meja registrasi pada Sabtu, 07 November 2026. Sampai jumpa!`;
  }

  function createTicketFile(): Promise<File> {
    return new Promise((resolve, reject) => {
      if (!canvasRef.current) {
        reject(new Error('Canvas tiket belum siap'));
        return;
      }
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 1120;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Canvas tiket tidak tersedia'));
        return;
      }
      context.fillStyle = '#fffdf8';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = '#b7d6cf';
      context.lineWidth = 6;
      context.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
      context.fillStyle = '#1d2c2b';
      context.font = '700 36px Arial';
      context.fillText('OPEN HOUSE SMKIT AS SYIFA', 68, 94);
      context.fillStyle = '#526363';
      context.font = '24px Arial';
      context.fillText('Tiket masuk', 68, 132);
      context.drawImage(canvasRef.current, 300, 180, 300, 300);
      context.fillStyle = '#1d2c2b';
      context.font = '700 32px Arial';
      context.fillText(data?.child_name || 'Calon siswa', 68, 570);
      context.fillStyle = '#526363';
      context.font = '23px Arial';
      context.fillText(`${data?.attendee_count || 1} peserta`, 68, 610);
      context.font = '700 32px monospace';
      context.fillStyle = '#1d2c2b';
      context.fillText(ticketCode, 68, 720);
      context.fillStyle = '#526363';
      context.font = '22px Arial';
      context.fillText('Sabtu, 07 November 2026 · 08.00–15.00 WIB', 68, 790);
      context.fillText('SMKIT As Syifa Boarding School, Jalancagak, Subang', 68, 830);
      context.fillText('Tunjukkan tiket ini kepada panitia saat registrasi.', 68, 900);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Gambar tiket gagal dibuat'));
          return;
        }
        resolve(new File([blob], `Tiket-OpenHouse-${ticketCode}.png`, { type: 'image/png' }));
      }, 'image/png');
    });
  }

  function handleDownloadImage() {
    if (!canvasRef.current) return;
    const source = canvasRef.current;
    const ticketCanvas = document.createElement('canvas');
    ticketCanvas.width = 900;
    ticketCanvas.height = 1120;
    const context = ticketCanvas.getContext('2d');
    if (!context) return;

    context.fillStyle = '#fffdf8';
    context.fillRect(0, 0, ticketCanvas.width, ticketCanvas.height);
    context.strokeStyle = '#b7d6cf';
    context.lineWidth = 6;
    context.strokeRect(24, 24, ticketCanvas.width - 48, ticketCanvas.height - 48);
    context.fillStyle = '#1d2c2b';
    context.font = '700 36px Arial';
    context.fillText('OPEN HOUSE SMKIT AS SYIFA', 68, 94);
    context.fillStyle = '#526363';
    context.font = '24px Arial';
    context.fillText('Tiket masuk', 68, 132);
    context.drawImage(source, 300, 180, 300, 300);
    context.fillStyle = '#1d2c2b';
    context.font = '700 32px Arial';
    context.fillText(data?.child_name || 'Calon siswa', 68, 570);
    context.fillStyle = '#526363';
    context.font = '23px Arial';
    context.fillText(`${data?.attendee_count || 1} peserta`, 68, 610);
    context.font = '700 32px monospace';
    context.fillStyle = '#1d2c2b';
    context.fillText(ticketCode, 68, 720);
    context.fillStyle = '#526363';
    context.font = '22px Arial';
    context.fillText('Sabtu, 07 November 2026 · 08.00–15.00 WIB', 68, 790);
    context.fillText('SMKIT As Syifa Boarding School, Jalancagak, Subang', 68, 830);
    context.fillText('Tunjukkan tiket ini kepada panitia saat registrasi.', 68, 900);

    const a = document.createElement('a');
    a.href = ticketCanvas.toDataURL('image/png');
    a.download = `Tiket-OpenHouse-${ticketCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function handleShareWa() {
    const msg = buildTicketMessage();
    try {
      const file = await createTicketFile();
      const shareData = { files: [file], title: 'Tiket Open House', text: msg };
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share(shareData);
        return;
      }
    } catch (error) {
      // Cancel pada native share bukan error yang perlu ditampilkan kepada peserta.
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }

    // Fallback desktop/browser lama: unduh gambar dan buka WhatsApp dengan teks.
    handleDownloadImage();
    const cleanPhone = (data?.parent_phone || '').replace(/[^0-9]/g, '');
    const targetUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(targetUrl, '_blank', 'noopener');
  }

  function handleCopyCode() {
    if (!ticketCode) return;
    navigator.clipboard.writeText(ticketCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="ticket-card" aria-label="Tiket Masuk Open House">
      <div className="ticket-card__header">
        <span className="ticket-card__badge">Tiket Masuk Resmi</span>
        <h2 className="ticket-card__title">Open House SMKIT As Syifa</h2>
        <p className="ticket-card__subtitle">Sabtu, 07 November 2026 • 08.00 - 15.00 WIB</p>
      </div>

      <div className="ticket-card__body">
        <div className="ticket-card__qr-box">
          <canvas ref={canvasRef} className="ticket-card__canvas" aria-label={`QR Code ${ticketCode}`} />
        </div>

        <div className="ticket-card__info">
          <div className="ticket-card__code-wrap">
            <span className="ticket-card__code-label">KODE TIKET:</span>
            <strong className="ticket-card__code">{ticketCode}</strong>
            <button
              type="button"
              className="ticket-card__btn-copy"
              onClick={handleCopyCode}
              title="Salin kode tiket"
            >
              {copied ? 'Tersalin!' : 'Salin'}
            </button>
          </div>

          {data && (
            <div className="ticket-card__meta">
              <p><strong>Calon Siswa:</strong> {data.child_name}</p>
              <p><strong>Rencana Hadir:</strong> {data.attendee_count} Orang</p>
            </div>
          )}
        </div>
      </div>

      <p className="ticket-card__instruction">
        Tunjukkan QR Code ini kepada panitia di meja registrasi saat tiba di lokasi acara.
      </p>

      <div className="ticket-card__actions">
        <button
          type="button"
          className="button button--secondary ticket-card__btn"
          onClick={handleDownloadImage}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Simpan Gambar Tiket
        </button>

        <button
          type="button"
          className="button button--primary ticket-card__btn ticket-card__btn--wa"
          onClick={handleShareWa}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          Kirim Tiket ke WhatsApp
        </button>
      </div>

      <style>{`
        .ticket-card {
          margin-block: var(--space-6);
          padding: var(--space-6);
          background: #ffffff;
          border: 2px solid var(--border-soft);
          border-radius: var(--radius-lg, 16px);
          /* Kedalaman dibuat dari garis dan bidang datar, tanpa efek glossy. */
          text-align: center;
        }
        .ticket-card__header {
          border-bottom: 1px dashed var(--border-soft);
          padding-bottom: var(--space-4);
          margin-bottom: var(--space-4);
        }
        .ticket-card__badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 2px 10px;
          border-radius: 999px;
          background: #e8f5e9;
          color: #2e7d32;
          margin-bottom: var(--space-2);
        }
        .ticket-card__title {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          margin: 0 0 var(--space-1);
          color: var(--ink);
        }
        .ticket-card__subtitle {
          font-size: 0.85rem;
          color: var(--ink-soft);
          margin: 0;
        }
        .ticket-card__body {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
        }
        .ticket-card__qr-box {
          padding: 8px;
          background: #ffffff;
          border: 1px solid var(--border-soft);
          border-radius: 12px;
          display: inline-flex;
        }
        .ticket-card__canvas {
          display: block;
          max-width: 100%;
          height: auto;
        }
        .ticket-card__code-wrap {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #f4f4f0;
          padding: 6px 14px;
          border-radius: 8px;
          margin-top: 4px;
        }
        .ticket-card__code-label {
          font-size: 0.75rem;
          color: var(--ink-soft);
          font-weight: 600;
        }
        .ticket-card__code {
          font-family: monospace;
          font-size: 1.2rem;
          letter-spacing: 0.08em;
          color: var(--brand-rpl, #1e3a8a);
        }
        .ticket-card__btn-copy {
          background: none;
          border: 1px solid var(--border-soft);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
        }
        .ticket-card__meta {
          margin-top: var(--space-2);
          font-size: 0.9rem;
          color: var(--ink);
          line-height: 1.4;
        }
        .ticket-card__meta p {
          margin: 2px 0;
        }
        .ticket-card__instruction {
          font-size: 0.85rem;
          color: var(--ink-soft);
          margin-bottom: var(--space-4);
          font-style: italic;
        }
        .ticket-card__actions {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-3);
          justify-content: center;
        }
        .ticket-card__btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
        }
        .ticket-card__btn--wa {
          background: #25d366;
          color: #ffffff;
          border-color: #25d366;
        }
        .ticket-card__btn--wa:hover {
          background: #1eb956;
        }
      `}</style>
    </div>
  );
}

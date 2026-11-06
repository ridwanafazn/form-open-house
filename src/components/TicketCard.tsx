import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { eventConfig } from '../config/event';
import { content } from '../config/content';
import TicketReminder from './TicketReminder';

interface SummaryData {
  child_name: string;
  attendee_count: number;
  ticket_code?: string;
  id?: string;
  parent_phone?: string;
}

const STORAGE_SUMMARY_KEY = 'oh_summary';

const ticket = content.thankyou.ticket;
const timeLabel = `${eventConfig.startTime.replace(':', '.')}–${eventConfig.endTime.replace(':', '.')} WIB`;
const dateLabel = `${eventConfig.dateText}, ${timeLabel}`;

export default function TicketCard() {
  const [data, setData] = useState<SummaryData | null>(null);
  const [ready, setReady] = useState(false);
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
    // `ready` mencegah tiket placeholder tampil sebelum sessionStorage dibaca.
    setReady(true);
  }, []);

  const ticketCode = data?.ticket_code || 'OH-TICKET';

  useEffect(() => {
    if (!ready || !canvasRef.current) return;
    QRCode.toCanvas(
      canvasRef.current,
      ticketCode,
      {
        width: 280,
        margin: 2,
        color: {
          dark: '#22262A',
          light: '#FFFFFF',
        },
      },
      (err) => {
        if (err) console.error('Gagal membuat QR Code:', err);
      },
    );
  }, [ticketCode, data, ready]);

  function buildTicketMessage() {
    const child = data?.child_name || 'Calon Siswa';
    const count = data?.attendee_count || 1;
    const ticketUrl = `${window.location.origin}/e-ticket/${encodeURIComponent(ticketCode)}`;
    return [
      'Assalamualaikum Ayah/Bunda.',
      '',
      'Pendaftaran Open House SMKIT As-Syifa berhasil kami terima.',
      '',
      `1. Calon siswa: ${child}`,
      `2. Total orang yang hadir: ${count} orang, termasuk calon siswa`,
      `3. Kode tiket: ${ticketCode}`,
      '',
      'Mohon simpan pesan dan gambar tiket ini. Tunjukkan QR Code kepada panitia saat registrasi di lokasi.',
      '',
      `Grup peserta: ${eventConfig.waJoinUrl ?? '-'}`,
      '',
      `Tiket digital:\n${ticketUrl}`,
      '',
      'Sampai bertemu di Open House.',
      'Wassalamualaikum.',
    ].join('\n');
  }

  // Gambar tiket dibuat identik dengan unduhan di halaman e-tiket
  // (PublicTicket): permukaan putih, teks slate, aksen emerald matte.
  function paintTicketImage(context: CanvasRenderingContext2D) {
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, 1000, 1260);
    context.strokeStyle = '#E2E8F0';
    context.lineWidth = 6;
    context.strokeRect(28, 28, 944, 1204);
    context.fillStyle = '#64748B';
    context.font = "700 30px 'Space Grotesk', Arial";
    context.fillText('TIKET DIGITAL', 76, 116);
    context.fillStyle = '#064E3B';
    context.fillRect(76, 136, 220, 6);
    context.fillStyle = '#0F172A';
    context.font = "700 46px 'Space Grotesk', Arial";
    context.fillText('Open House SMKIT As-Syifa', 76, 200);
    context.fillStyle = '#FFFFFF';
    context.fillRect(76, 236, 262, 44);
    context.strokeStyle = '#E2E8F0';
    context.lineWidth = 3;
    context.strokeRect(76, 236, 262, 44);
    context.fillStyle = '#166534';
    context.font = "600 24px 'Space Grotesk', Arial";
    context.fillText('TERDAFTAR', 96, 266);
    if (canvasRef.current) {
      context.drawImage(canvasRef.current, 332, 320, 336, 336);
    }
    const child = data?.child_name || 'Calon Siswa';
    const count = data?.attendee_count || 1;
    context.fillStyle = '#0F172A';
    context.font = "700 42px 'Space Grotesk', Arial";
    context.fillText(child, 76, 732);
    context.font = "400 26px 'DM Sans', Arial";
    context.fillStyle = '#64748B';
    context.fillText(`${count} orang`, 76, 778);
    context.fillStyle = '#0F172A';
    context.font = "700 40px 'DM Mono', monospace";
    context.fillText(ticketCode, 76, 902);
    context.fillStyle = '#64748B';
    context.font = "400 25px 'DM Sans', Arial";
    context.fillText(dateLabel, 76, 966);
    context.fillText('Tunjukkan tiket ini kepada panitia saat registrasi.', 76, 1018);
    context.fillText('SMKIT As-Syifa Boarding School, Jalancagak, Subang', 76, 1056);
  }

  function createTicketFile(): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1260;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Canvas tiket tidak tersedia'));
        return;
      }
      paintTicketImage(context);
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
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1260;
    const context = canvas.getContext('2d');
    if (!context) return;
    paintTicketImage(context);

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
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

  // Satu wadah dengan tiga keadaan: kerangka sebelum sessionStorage dibaca,
  // arahan saat data tiket tidak ada, dan tiket lengkap saat data tersedia.
  return (
    <div
      className={`ticket-card${ready ? '' : ' ticket-card--loading'}`}
      aria-label="Tiket masuk Open House"
    >
      {ready && !data?.ticket_code && (
        <>
          <div className="ticket-card__head">
            <span className="ticket-card__eyebrow">{ticket.label}</span>
          </div>
          <div className="ticket-card__empty">
            <h2 className="ticket-card__title">{ticket.emptyTitle}</h2>
            <p className="ticket-card__empty-text">{ticket.emptyText}</p>
          </div>
        </>
      )}

      {ready && data?.ticket_code && (
        <>
          <div className="ticket-card__head">
            <span className="ticket-card__eyebrow">{ticket.label}</span>
            <span className="ticket-card__status">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m5 13 4 4L19 7" />
              </svg>
              {ticket.status}
            </span>
          </div>

          <div className="ticket-card__event">
            <h2 className="ticket-card__title">Open House SMKIT As-Syifa</h2>
            <p className="ticket-card__when">{dateLabel}</p>
          </div>

          <div className="ticket-card__body">
            <div className="ticket-card__qr-box">
              <canvas
                ref={canvasRef}
                className="ticket-card__canvas"
                aria-label={`QR Code ${ticketCode}`}
              />
            </div>

            <dl className="ticket-card__facts">
              <div className="ticket-card__fact">
                <dt>{ticket.child}</dt>
                <dd>{data?.child_name || 'Calon siswa'}</dd>
              </div>
              <div className="ticket-card__fact">
                <dt>{ticket.attendees}</dt>
                <dd>
                  {data?.attendee_count || 1} {ticket.personUnit}
                </dd>
              </div>
            </dl>
          </div>

          <div className="ticket-card__code-block">
            <span className="ticket-card__code-label">{ticket.codeLabel}</span>
            <div className="ticket-card__code-row">
              <code className="ticket-card__code">{ticketCode}</code>
              <button type="button" className="ticket-card__btn-copy" onClick={handleCopyCode}>
                {copied ? ticket.copied : ticket.copy}
              </button>
            </div>
          </div>

          <p className="ticket-card__hint">{ticket.instruction}</p>

          <div className="ticket-card__actions">
            <button
              type="button"
              className="button button--primary ticket-card__btn"
              onClick={handleDownloadImage}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M4 19h16" />
              </svg>
              {ticket.download}
            </button>

            <button
              type="button"
              className="button button--secondary ticket-card__btn"
              onClick={handleShareWa}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {ticket.share}
            </button>
          </div>

          <TicketReminder />
        </>
      )}

      <style>{`
        .ticket-card {
          overflow: hidden;
          border: 1px solid var(--paper-grid);
          border-radius: 12px;
          background: #ffffff;
        }
        .ticket-card--loading {
          min-height: 380px;
          background: var(--paper-card);
        }
        .ticket-card__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--paper-grid);
          background: var(--paper-card);
        }
        .ticket-card__eyebrow {
          color: var(--ink-soft);
          font-family: var(--font-tech);
          font-size: 0.66rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          line-height: 1.6;
          text-transform: uppercase;
        }
        .ticket-card__status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 7px;
          border: 1px solid var(--teal-dark);
          border-radius: 4px;
          background: var(--teal-pale);
          color: var(--teal-dark);
          font-family: var(--font-tech);
          font-size: 0.64rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          line-height: 1.6;
          text-transform: uppercase;
        }
        .ticket-card__event {
          padding: 16px 16px 0;
        }
        .ticket-card__title {
          margin: 0;
          color: var(--ink);
          font-family: var(--font-heading);
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1.3;
        }
        .ticket-card__when {
          margin: 2px 0 0;
          color: var(--ink-soft);
          font-size: 0.8rem;
          line-height: 1.5;
        }
        .ticket-card__body {
          display: grid;
          grid-template-columns: 156px minmax(0, 1fr);
          gap: 16px;
          align-items: center;
          padding: 16px;
        }
        .ticket-card__body > * {
          min-width: 0;
        }
        .ticket-card__qr-box {
          min-width: 0;
          padding: 6px;
          border: 1px solid var(--paper-grid);
          border-radius: 8px;
          background: #ffffff;
        }
        .ticket-card__canvas {
          display: block;
          width: 100% !important;
          max-width: 100%;
          height: auto !important;
          aspect-ratio: 1;
        }
        .ticket-card__facts {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 0;
          margin: 0;
        }
        .ticket-card__fact dt {
          color: var(--ink-soft);
          font-size: 0.64rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          line-height: 1.6;
          text-transform: uppercase;
        }
        .ticket-card__fact dd {
          margin: 1px 0 0;
          color: var(--ink);
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 700;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }
        .ticket-card__code-block {
          display: flex;
          flex-direction: column;
          gap: 1px;
          margin: 0 16px;
          padding: 12px 0;
          border-top: 1px dashed var(--paper-grid);
        }
        .ticket-card__code-label {
          color: var(--ink-soft);
          font-size: 0.64rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          line-height: 1.6;
          text-transform: uppercase;
        }
        .ticket-card__code-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .ticket-card__code {
          color: var(--teal-dark);
          font-family: var(--font-tech);
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.06em;
        }
        .ticket-card__btn-copy {
          flex: none;
          padding: 3px 8px;
          border: 1px solid var(--paper-grid);
          border-radius: 6px;
          background: transparent;
          color: var(--ink-soft);
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          transition:
            border-color 0.2s ease,
            color 0.2s ease;
        }
        .ticket-card__btn-copy:hover {
          border-color: var(--teal-dark);
          color: var(--teal-dark);
        }
        .ticket-card__hint {
          margin: 0 16px 16px;
          padding-top: 12px;
          border-top: 1px dashed var(--paper-grid);
          color: var(--ink-soft);
          font-size: 0.8rem;
          line-height: 1.5;
        }
        .ticket-card__empty {
          padding: 20px 16px 24px;
        }
        .ticket-card__empty-text {
          max-width: 44ch;
          margin-top: 6px;
          color: var(--ink-soft);
          font-size: 0.9rem;
          line-height: 1.55;
        }
        .ticket-card__actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          padding: 0 16px 16px;
        }
        .ticket-card__btn {
          width: 100%;
          padding: 10px 12px;
          font-size: 0.85rem;
        }
        .ticket-card__btn svg {
          flex: none;
        }
        @media (max-width: 599px) {
          .ticket-card__body {
            grid-template-columns: minmax(0, 1fr);
            justify-items: center;
            gap: 14px;
          }
          .ticket-card__qr-box {
            width: 168px;
          }
          .ticket-card__facts {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            width: 100%;
          }
        }
        @media (max-width: 459px) {
          .ticket-card__actions {
            grid-template-columns: minmax(0, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

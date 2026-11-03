import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { eventConfig } from '../config/event';

export interface PublicTicketData {
  child_name: string;
  attendee_count: number;
  city: string;
  school: string;
  ticket_code: string;
}

interface Props {
  ticket?: PublicTicketData;
  code?: string;
}

const dateLabel = `${eventConfig.dateText}, ${eventConfig.startTime.replace(':', '.')}–${eventConfig.endTime.replace(':', '.')} WIB`;

export default function PublicTicket({ ticket: initialTicket, code }: Props) {
  const [ticket, setTicket] = useState<PublicTicketData | null>(initialTicket ?? null);
  const [loading, setLoading] = useState(!initialTicket);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (initialTicket || !code) return;
    fetch(`/api/ticket?code=${encodeURIComponent(code)}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('ticket'))))
      .then((data: { ticket: PublicTicketData }) => setTicket(data.ticket))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [code, initialTicket]);

  useEffect(() => {
    if (!ticket || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, ticket.ticket_code, {
      width: 280,
      margin: 2,
      color: { dark: '#22262A', light: '#FFFFFF' },
    });
  }, [ticket]);

  function copyCode() {
    if (!ticket) return;
    navigator.clipboard.writeText(ticket.ticket_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function downloadTicket() {
    if (!ticket || !canvasRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1260;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#E3DCCB';
    context.lineWidth = 6;
    context.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);
    context.fillStyle = '#5B6068';
    context.font = "700 30px 'Space Grotesk', Arial";
    context.fillText('TIKET DIGITAL', 76, 116);
    context.fillStyle = '#0F6F6A';
    context.fillRect(76, 136, 220, 6);
    context.fillStyle = '#22262A';
    context.font = "700 46px 'Space Grotesk', Arial";
    context.fillText('Open House SMKIT As-Syifa', 76, 200);
    context.fillStyle = '#FFFFFF';
    context.fillRect(76, 236, 262, 44);
    context.strokeStyle = '#E3DCCB';
    context.lineWidth = 3;
    context.strokeRect(76, 236, 262, 44);
    context.fillStyle = '#0F6F6A';
    context.font = "600 24px 'Space Grotesk', Arial";
    context.fillText('TERDAFTAR', 96, 266);
    context.drawImage(canvasRef.current, 332, 320, 336, 336);
    context.fillStyle = '#22262A';
    context.font = "700 42px 'Space Grotesk', Arial";
    context.fillText(ticket.child_name, 76, 732);
    context.font = "400 26px 'DM Sans', Arial";
    context.fillStyle = '#5B6068';
    context.fillText(`${ticket.attendee_count} peserta · ${ticket.school}`, 76, 778);
    context.fillText(ticket.city, 76, 818);
    context.fillStyle = '#22262A';
    context.font = "700 40px 'DM Mono', monospace";
    context.fillText(ticket.ticket_code, 76, 902);
    context.fillStyle = '#5B6068';
    context.font = "400 25px 'DM Sans', Arial";
    context.fillText(dateLabel, 76, 966);
    context.fillText('Tunjukkan tiket ini kepada panitia saat registrasi.', 76, 1018);
    context.fillText('SMKIT As-Syifa Boarding School, Jalancagak, Subang', 76, 1056);
    const anchor = document.createElement('a');
    anchor.href = canvas.toDataURL('image/png');
    anchor.download = `Tiket-OpenHouse-${ticket.ticket_code}.png`;
    anchor.click();
  }

  if (loading) return <p className="pt-message">Memuat tiket…</p>;
  if (error || !ticket)
    return (
      <div className="pt-message">
        <h1 className="pt-message__title">Tiket tidak ditemukan</h1>
        <p>
          Tautan tiket mungkin sudah tidak berlaku. Buka kembali tautan dari pesan WhatsApp panitia,
          atau hubungi admisi.
        </p>
      </div>
    );

  return (
    <article className="pt" aria-label="Tiket digital Open House">
      <div className="pt__head">
        <span className="pt__kicker">Tiket digital</span>
        <span className="pt__status">Terdaftar</span>
      </div>

      <div className="pt__event">
        <h1>{eventConfig.name}</h1>
        <p className="pt__when">{dateLabel}</p>
      </div>

      <div className="pt__body">
        <div className="pt__qr">
          <canvas ref={canvasRef} aria-label={`QR Code tiket ${ticket.ticket_code}`} />
        </div>

        <dl className="pt__facts">
          <div className="pt__fact">
            <dt>Calon siswa</dt>
            <dd>{ticket.child_name}</dd>
          </div>
          <div className="pt__fact">
            <dt>Jumlah hadir</dt>
            <dd>{ticket.attendee_count} orang</dd>
          </div>
          <div className="pt__fact">
            <dt>Asal sekolah</dt>
            <dd>{ticket.school}</dd>
          </div>
          <div className="pt__fact">
            <dt>Asal kota</dt>
            <dd>{ticket.city}</dd>
          </div>
        </dl>
      </div>

      <div className="pt__code-block">
        <span className="pt__code-label">Kode tiket</span>
        <div className="pt__code-row">
          <code className="pt__code">{ticket.ticket_code}</code>
          <button type="button" className="pt__copy" onClick={copyCode}>
            {copied ? 'Tersalin' : 'Salin'}
          </button>
        </div>
      </div>

      <p className="pt__hint">
        Tunjukkan QR code ini ke panitia di meja registrasi. Tidak perlu dicetak.
      </p>

      <button
        type="button"
        className="button button--primary pt__download"
        onClick={downloadTicket}
      >
        Simpan gambar tiket
      </button>

      <style>{`
        .pt {
          max-width: 620px;
          margin: 0 auto;
          overflow: hidden;
          border: 1px solid var(--paper-grid);
          border-radius: 12px;
          background: #ffffff;
        }
        .pt__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 16px;
          border-bottom: 1px solid var(--paper-grid);
          background: var(--paper-card);
        }
        .pt__kicker,
        .pt__status,
        .pt__code-label {
          font-family: var(--font-tech);
          font-size: 0.66rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          line-height: 1.6;
          text-transform: uppercase;
        }
        .pt__kicker { color: var(--ink-soft); }
        .pt__status {
          padding: 2px 7px;
          border: 1px solid var(--teal-dark);
          border-radius: 4px;
          background: var(--teal-pale);
          color: var(--teal-dark);
        }
        .pt__event { padding: 16px 16px 0; }
        .pt__event h1 {
          margin: 0;
          color: var(--ink);
          font-family: var(--font-heading);
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1.3;
        }
        .pt__when {
          margin: 2px 0 0;
          color: var(--ink-soft);
          font-size: 0.8rem;
          line-height: 1.5;
        }
        .pt__body {
          display: grid;
          grid-template-columns: 156px minmax(0, 1fr);
          gap: 16px;
          align-items: center;
          padding: 16px;
        }
        .pt__body > * { min-width: 0; }
        .pt__qr {
          padding: 6px;
          border: 1px solid var(--paper-grid);
          border-radius: 8px;
          background: #ffffff;
        }
        .pt__qr canvas {
          display: block;
          width: 100% !important;
          max-width: 100%;
          height: auto !important;
          aspect-ratio: 1;
        }
        .pt__facts {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin: 0;
        }
        .pt__fact dt {
          color: var(--ink-soft);
          font-size: 0.64rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          line-height: 1.6;
          text-transform: uppercase;
        }
        .pt__fact dd {
          margin: 1px 0 0;
          color: var(--ink);
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 700;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }
        .pt__code-block {
          display: flex;
          flex-direction: column;
          gap: 1px;
          margin: 0 16px;
          padding: 12px 0;
          border-top: 1px dashed var(--paper-grid);
        }
        .pt__code-label { color: var(--ink-soft); }
        .pt__code-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .pt__code {
          color: var(--teal-dark);
          font-family: var(--font-tech);
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: 0.06em;
        }
        .pt__copy {
          flex: none;
          padding: 3px 8px;
          border: 1px solid var(--paper-grid);
          border-radius: 6px;
          background: transparent;
          color: var(--ink-soft);
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          transition: border-color 0.2s ease, color 0.2s ease;
        }
        .pt__copy:hover {
          border-color: var(--teal-dark);
          color: var(--teal-dark);
        }
        .pt__hint {
          margin: 0 16px 16px;
          padding-top: 12px;
          border-top: 1px dashed var(--paper-grid);
          color: var(--ink-soft);
          font-size: 0.8rem;
          line-height: 1.5;
        }
        .pt__download {
          width: calc(100% - 32px);
          margin: 0 16px 16px;
        }
        .pt-message {
          max-width: 620px;
          margin: 0 auto;
          padding: 24px;
          border: 1px solid var(--paper-grid);
          border-radius: 12px;
          background: var(--paper-card);
          color: var(--ink-soft);
          text-align: center;
          line-height: 1.55;
        }
        .pt-message__title {
          margin: 0 0 6px;
          color: var(--ink);
          font-family: var(--font-heading);
          font-size: 1.1rem;
        }
        @media (max-width: 599px) {
          .pt__body {
            grid-template-columns: minmax(0, 1fr);
            justify-items: center;
            gap: 14px;
          }
          .pt__qr { width: 168px; }
          .pt__facts {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            width: 100%;
          }
        }
      `}</style>
    </article>
  );
}

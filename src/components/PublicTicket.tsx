import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

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

export default function PublicTicket({ ticket: initialTicket, code }: Props) {
  const [ticket, setTicket] = useState<PublicTicketData | null>(initialTicket ?? null);
  const [loading, setLoading] = useState(!initialTicket);
  const [error, setError] = useState(false);
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
      color: { dark: '#1d2c2b', light: '#fffdf8' },
    });
  }, [ticket]);

  function downloadTicket() {
    if (!ticket || !canvasRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1260;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.fillStyle = '#fffdf8';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#b7d6cf';
    context.lineWidth = 8;
    context.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);
    context.fillStyle = '#1d2c2b';
    context.font = '700 42px Arial';
    context.fillText('OPEN HOUSE SMKIT AS SYIFA', 76, 112);
    context.fillStyle = '#526363';
    context.font = '28px Arial';
    context.fillText('Tiket Masuk', 76, 156);
    context.drawImage(canvasRef.current, 330, 212, 340, 340);
    context.fillStyle = '#1d2c2b';
    context.font = '700 38px Arial';
    context.fillText(ticket.child_name, 76, 650);
    context.font = '26px Arial';
    context.fillStyle = '#526363';
    context.fillText(`${ticket.attendee_count} peserta · ${ticket.school}`, 76, 698);
    context.fillText(ticket.city, 76, 738);
    context.fillStyle = '#1d2c2b';
    context.font = '700 36px monospace';
    context.fillText(ticket.ticket_code, 76, 830);
    context.fillStyle = '#526363';
    context.font = '25px Arial';
    context.fillText('Sabtu, 07 November 2026 · 08.00–15.00 WIB', 76, 910);
    context.fillText('Tunjukkan tiket ini kepada panitia saat registrasi.', 76, 970);
    context.fillText('SMKIT As Syifa Boarding School, Jalancagak, Subang', 76, 1015);
    const anchor = document.createElement('a');
    anchor.href = canvas.toDataURL('image/png');
    anchor.download = `Tiket-OpenHouse-${ticket.ticket_code}.png`;
    anchor.click();
  }

  if (loading) return <p className="public-ticket__message">Memuat tiket…</p>;
  if (error || !ticket) return <p className="public-ticket__message">Tiket tidak ditemukan atau tautannya sudah tidak tersedia.</p>;

  return (
    <article className="public-ticket" aria-label="Tiket digital Open House">
      <div className="public-ticket__topline">
        <span>OPEN HOUSE</span>
        <span>SMKIT AS SYIFA</span>
      </div>
      <div className="public-ticket__heading">
        <div>
          <p className="public-ticket__eyebrow">Tiket masuk</p>
          <h1>{ticket.child_name}</h1>
          <p className="public-ticket__muted">{ticket.attendee_count} peserta · {ticket.school}</p>
        </div>
        <span className="public-ticket__status">Terdaftar</span>
      </div>
      <div className="public-ticket__divider" aria-hidden="true" />
      <div className="public-ticket__qr">
        <canvas ref={canvasRef} aria-label={`QR Code tiket ${ticket.ticket_code}`} />
      </div>
      <div className="public-ticket__code-label">KODE TIKET</div>
      <div className="public-ticket__code">{ticket.ticket_code}</div>
      <dl className="public-ticket__details">
        <div><dt>Acara</dt><dd>Open House SMKIT As Syifa</dd></div>
        <div><dt>Waktu</dt><dd>Sabtu, 07 November 2026 · 08.00–15.00 WIB</dd></div>
        <div><dt>Lokasi</dt><dd>Jalancagak, Subang</dd></div>
      </dl>
      <p className="public-ticket__instruction">Tunjukkan QR Code ini kepada panitia saat registrasi di lokasi.</p>
      <button type="button" className="button button--primary" onClick={downloadTicket}>Simpan tiket</button>
      <style>{`
        .public-ticket { max-width: 620px; margin: 24px auto; padding: 26px; border: 1px solid #b7d6cf; border-radius: 18px; background: #fffdf8; color: #1d2c2b; }
        .public-ticket__topline, .public-ticket__heading, .public-ticket__details div { display: flex; justify-content: space-between; gap: 16px; }
        .public-ticket__topline { color: #36736d; font: 700 .75rem/1.2 var(--font-heading); letter-spacing: .14em; }
        .public-ticket__heading { align-items: flex-start; margin-top: 28px; }
        .public-ticket__eyebrow, .public-ticket__muted, .public-ticket__instruction, .public-ticket__details { color: #526363; }
        .public-ticket__eyebrow, .public-ticket__muted, .public-ticket__instruction { margin: 0; }
        .public-ticket h1 { margin: 4px 0; font-size: clamp(1.7rem, 5vw, 2.5rem); }
        .public-ticket__status { padding: 6px 10px; border: 1px solid #9dc8bf; border-radius: 8px; color: #36736d; font: 700 .75rem var(--font-heading); }
        .public-ticket__divider { margin: 24px 0; border-top: 1px dashed #9dc8bf; }
        .public-ticket__qr { display: flex; justify-content: center; padding: 16px; }
        .public-ticket__qr canvas { max-width: 100%; border: 1px solid #e0e7df; }
        .public-ticket__code-label { margin-top: 12px; color: #526363; font: 700 .72rem var(--font-heading); letter-spacing: .13em; }
        .public-ticket__code { margin-top: 4px; font: 700 clamp(1.35rem, 5vw, 2rem) monospace; letter-spacing: .08em; }
        .public-ticket__details { display: grid; gap: 12px; margin: 28px 0; padding: 18px 0; border-top: 1px solid #e0e7df; border-bottom: 1px solid #e0e7df; }
        .public-ticket__details dt { font-size: .8rem; }
        .public-ticket__details dd { margin: 0; text-align: right; color: #1d2c2b; font-weight: 700; }
        .public-ticket__instruction { margin-bottom: 20px; font-size: .9rem; }
        .public-ticket__message { max-width: 620px; margin: 64px auto; padding: 24px; text-align: center; }
        @media (max-width: 560px) { .public-ticket { margin: 12px 0; padding: 18px; border-radius: 14px; } .public-ticket__details div { display: grid; gap: 3px; } .public-ticket__details dd { text-align: left; } }
      `}</style>
    </article>
  );
}

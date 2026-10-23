import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
// Bahasa desain admin (font DM Sans / Space Grotesk + token warna) dipakai
// agar tiket publik terasa satu keluarga dengan dashboard panitia.
import '../styles/admin.css';

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
      color: { dark: '#0F172A', light: '#FFFFFF' },
    });
  }, [ticket]);

  function downloadTicket() {
    if (!ticket || !canvasRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1260;
    const context = canvas.getContext('2d');
    if (!context) return;
    // Palet mengikuti admin.css: surface putih, teks slate, aksen emerald matte.
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#E2E8F0';
    context.lineWidth = 6;
    context.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);
    context.fillStyle = '#64748B';
    context.font = "700 30px 'Space Grotesk', Arial";
    context.fillText('TIKET DIGITAL', 76, 116);
    context.fillStyle = '#064E3B';
    context.fillRect(76, 136, 220, 6);
    context.fillStyle = '#0F172A';
    context.font = "700 46px 'Space Grotesk', Arial";
    context.fillText('Open House SMKIT As Syifa', 76, 200);
    context.fillStyle = '#FFFFFF';
    context.fillRect(76, 236, 262, 44);
    context.strokeStyle = '#E2E8F0';
    context.lineWidth = 3;
    context.strokeRect(76, 236, 262, 44);
    context.fillStyle = '#166534';
    context.font = "600 24px 'Space Grotesk', Arial";
    context.fillText('TERDAFTAR ✓', 96, 266);
    context.drawImage(canvasRef.current, 332, 320, 336, 336);
    context.fillStyle = '#0F172A';
    context.font = "700 42px 'Space Grotesk', Arial";
    context.fillText(ticket.child_name, 76, 732);
    context.font = "400 26px 'DM Sans', Arial";
    context.fillStyle = '#64748B';
    context.fillText(`${ticket.attendee_count} peserta · ${ticket.school}`, 76, 778);
    context.fillText(ticket.city, 76, 818);
    context.fillStyle = '#0F172A';
    context.font = "700 40px 'DM Mono', monospace";
    context.fillText(ticket.ticket_code, 76, 902);
    context.fillStyle = '#64748B';
    context.font = "400 25px 'DM Sans', Arial";
    context.fillText('Sabtu, 07 November 2026 · 08.00–15.00 WIB', 76, 966);
    context.fillText('Tunjukkan tiket ini kepada panitia saat registrasi.', 76, 1018);
    context.fillText('SMKIT As Syifa Boarding School, Jalancagak, Subang', 76, 1056);
    const anchor = document.createElement('a');
    anchor.href = canvas.toDataURL('image/png');
    anchor.download = `Tiket-OpenHouse-${ticket.ticket_code}.png`;
    anchor.click();
  }

  if (loading) return <p className="public-ticket__message">Memuat tiket…</p>;
  if (error || !ticket) return <p className="public-ticket__message">Tiket tidak ditemukan atau tautannya sudah tidak tersedia.</p>;

  return (
    <article className="public-ticket" aria-label="Tiket digital Open House">
      <p className="public-ticket__kicker">Tiket digital</p>
      <div className="public-ticket__heading">
        <div>
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
      <button type="button" className="admin-btn admin-btn--primary public-ticket__download" onClick={downloadTicket}>Simpan tiket</button>
      <style>{`
        /* Token mengikuti admin.css (DM Sans / Space Grotesk, slate + emerald matte) */
        .public-ticket { max-width: 620px; margin: 24px auto; padding: 32px; border: 1px solid var(--admin-border); border-radius: var(--radius-lg); background: var(--admin-surface); color: var(--admin-text-main); font-family: 'DM Sans', sans-serif; }
        .public-ticket__heading, .public-ticket__details div { display: flex; justify-content: space-between; gap: 16px; }
        .public-ticket__kicker { margin: 0 0 20px; color: var(--admin-text-muted); font-family: 'Space Grotesk', sans-serif; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
        .public-ticket__heading { align-items: flex-start; }
        .public-ticket__muted, .public-ticket__instruction, .public-ticket__details dt { color: var(--admin-text-muted); }
        .public-ticket__muted, .public-ticket__instruction { margin: 0; }
        .public-ticket h1 { margin: 4px 0 6px; color: var(--admin-primary); font-family: 'Space Grotesk', sans-serif; font-size: clamp(1.6rem, 5vw, 2.3rem); font-weight: 700; letter-spacing: -0.04em; line-height: 1.1; }
        .public-ticket__status { flex-shrink: 0; padding: 6px 12px; border-radius: var(--radius-pill); background: #DCFCE7; color: #166534; font-size: 0.8rem; font-weight: 600; }
        .public-ticket__divider { margin: 24px 0; border-top: 1px dotted #CBD5E1; }
        .public-ticket__qr { display: flex; justify-content: center; padding: 8px 0 16px; }
        .public-ticket__qr canvas { max-width: 100%; border: 1px solid var(--admin-border); border-radius: var(--radius-md); }
        .public-ticket__code-label { margin-top: 8px; color: var(--admin-text-muted); font-family: 'Space Grotesk', sans-serif; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.13em; }
        .public-ticket__code { margin-top: 4px; color: var(--admin-primary); font-family: 'DM Mono', monospace; font-size: clamp(1.35rem, 5vw, 2rem); font-weight: 700; letter-spacing: 0.08em; }
        .public-ticket__details { display: grid; gap: 12px; margin: 28px 0; padding: 18px 0; border-top: 1px solid var(--admin-border); border-bottom: 1px solid var(--admin-border); }
        .public-ticket__details dt { font-size: 0.8rem; }
        .public-ticket__details dd { margin: 0; text-align: right; color: var(--admin-primary); font-weight: 700; }
        .public-ticket__instruction { margin-bottom: 20px; font-size: 0.9rem; }
        .public-ticket__download { width: 100%; }
        .public-ticket__message { max-width: 620px; margin: 64px auto; padding: 24px; text-align: center; font-family: 'DM Sans', sans-serif; color: var(--admin-text-main, #1E293B); }
        @media (max-width: 560px) { .public-ticket { margin: 12px 0; padding: 20px; } .public-ticket__details div { display: grid; gap: 3px; } .public-ticket__details dd { text-align: left; } }
      `}</style>
    </article>
  );
}

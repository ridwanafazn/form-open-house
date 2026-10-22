/**
 * Utilitas integrasi WhatsApp via Fonnte API (https://fonnte.com)
 * Digunakan untuk mengirim notifikasi konfirmasi pendaftaran otomatis
 * beserta gambar QR Code tiket masuk ke nomor WhatsApp pendaftar.
 */

export interface SendWhatsAppParams {
  target: string;
  message: string;
  imageUrl?: string;
  token?: string;
  fetchImpl?: typeof fetch;
}

export interface FonnteResponse {
  status: boolean;
  target?: string[];
  reason?: string;
  detail?: string;
}

/**
 * Normalisasi nomor WhatsApp untuk Fonnte.
 * Fonnte menerima format '0812...' atau '62812...'.
 * Kita pastikan tanda '+' dibuang.
 */
export function sanitizePhoneForFonnte(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('0')) {
    return '62' + digits.slice(1);
  }
  return digits;
}

/**
 * Kirim pesan WhatsApp (teks + gambar tiket QR) melalui Fonnte.
 * Berjalan secara non-blocking; jika token belum disetel atau Fonnte gagal,
 * fungsi mengembalikan status false tanpa menghentikan alur aplikasi.
 */
export async function sendWhatsAppViaFonnte({
  target,
  message,
  imageUrl,
  token,
  fetchImpl = globalThis.fetch.bind(globalThis),
}: SendWhatsAppParams): Promise<boolean> {
  if (!token || !token.trim()) {
    console.warn('[Fonnte] FONNTE_API_TOKEN belum diatur. Melewati pengiriman WhatsApp otomatis.');
    return false;
  }

  const cleanTarget = sanitizePhoneForFonnte(target);
  if (!cleanTarget) {
    console.warn('[Fonnte] Nomor tujuan tidak valid.');
    return false;
  }

  try {
    const formData = new FormData();
    formData.append('target', cleanTarget);
    formData.append('message', message);
    formData.append('countryCode', '62');

    if (imageUrl) {
      formData.append('url', imageUrl);
    }

    const res = await fetchImpl('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: token.trim(),
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[Fonnte] Gagal mengirim pesan. Status:', res.status, errText);
      return false;
    }

    const json = (await res.json().catch(() => ({}))) as FonnteResponse;
    if (json.status) {
      console.log('[Fonnte] Berhasil mengirim tiket WhatsApp.');
      return true;
    } else {
      console.warn('[Fonnte] Respons Fonnte bukan sukses:', json.reason || json.detail);
      return false;
    }
  } catch (err) {
    console.error('[Fonnte] Terjadi pengecualian saat memanggil API Fonnte:', err);
    return false;
  }
}

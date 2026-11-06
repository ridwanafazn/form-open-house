/**
 * Kode tiket ringkas 8 karakter (misal: OH-7K9W2B).
 * Memakai huruf dan angka yang tidak ambigu: tanpa 0, O, 1, I.
 */
export function generateTicketCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `OH-${rand}`;
}

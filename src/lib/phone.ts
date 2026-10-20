// Normalisasi nomor HP Indonesia ke format internasional 62x.
// Dipakai browser maupun server. Semua karakter selain angka dibuang.

export function normalizePhone(input: string): string {
  let digits = input.replace(/\D+/g, '');
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (digits.startsWith('8')) {
    digits = '62' + digits;
  }
  return '+' + digits;
}

// Pola dari docs/TRD.md: 62 8 diikuti 8-11 digit.
export function isValidPhone(input: string): boolean {
  return /^\+628\d{8,11}$/.test(input);
}

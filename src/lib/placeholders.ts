import { readFileSync } from 'node:fs';

// Menemukan teks pengganti `[ISI: ...]` pada sejumlah berkas. Dipakai oleh
// skrip build agar nilai yang belum diisi terlihat jelas jika sampai tayang.
export function findPlaceholders(filePaths: string[]): { file: string; match: string }[] {
  const results: { file: string; match: string }[] = [];
  for (const file of filePaths) {
    let source: string;
    try {
      source = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const regex = /\[ISI:[^\]]*\]/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(source)) !== null) {
      results.push({ file, match: match[0] });
    }
  }
  return results;
}

// Menghitung apakah lintasan teks yang disusun runtime masih memuat placeholder.
export function containsPlaceholder(...values: string[]): boolean {
  const regex = /\[ISI:/;
  return values.some((value) => regex.test(value));
}

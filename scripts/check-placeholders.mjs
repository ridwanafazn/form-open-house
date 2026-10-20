// Skrip build: gagal bila ada teks pengganti [ISI: tersisa di berkas konfigurasi
// dan variabel lingkungan FAIL_ON_PLACEHOLDER=true.
// Berkas konfigurasi adalah src/config/event.ts dan src/config/content.ts.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const configDir = path.resolve(here, '../src/config');
const files = ['event.ts', 'content.ts'].map((f) => path.join(configDir, f));

const regex = /\[ISI:[^\]]*\]/g;

function scan(file) {
  let source;
  try {
    source = readFileSync(file, 'utf8');
  } catch {
    return [];
  }
  const found = [];
  let match;
  while ((match = regex.exec(source)) !== null) {
    found.push({ file, match: match[0] });
  }
  return found;
}

const total = [];
for (const file of files) {
  for (const m of scan(file)) {
    console.warn(`${m.file}: teks pengganti tersisa -> ${m.match}`);
    total.push(m);
  }
}

const failOnPlaceholder = process.env.FAIL_ON_PLACEHOLDER === 'true';
if (failOnPlaceholder && total.length > 0) {
  console.error(
    `\nFAIL_ON_PLACEHOLDER=true dan ditemukan ${total.length} teks pengganti [ISI:. ` +
      `Isi semua nilai di src/config/event.ts dan src/config/content.ts sebelum tayang.`,
  );
  process.exit(1);
}

if (total.length > 0) {
  console.warn(`\nDitemukan ${total.length} teks pengganti [ISI: di konfigurasi. ` + 
    `Tetap dibangun karena FAIL_ON_PLACEHOLDER tidak true.`);
} else {
  console.log('Tidak ada teks pengganti [ISI: di konfigurasi.');
}

import { describe, it, expect, afterAll } from 'vitest';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { findPlaceholders, containsPlaceholder } from '../../src/lib/placeholders';

const tmp = mkdtempSync(path.join(tmpdir(), 'placeholders-'));
const files = [
  path.join(tmp, 'a.ts'),
  path.join(tmp, 'b.ts'),
  path.join(tmp, 'c.ts'),
];

afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe('findPlaceholders', () => {
  it('menemukan placeholder [ISI: di sebuah berkas', () => {
    writeFileSync(files[0], "const a = '[ISI: nama]';\nconst b = 'tidak ada';\n");
    const result = findPlaceholders([files[0]]);
    expect(result).toHaveLength(1);
    expect(result[0].file).toBe(files[0]);
    expect(result[0].match).toBe('[ISI: nama]');
  });

  it('menemukan banyak placeholder dalam satu berkas', () => {
    writeFileSync(
      files[1],
      "const a = '[ISI: satu]';\nconst b = '[ISI: dua]';\nconst c = '[ISI: tiga]';\n",
    );
    const result = findPlaceholders([files[1]]);
    expect(result).toHaveLength(3);
  });

  it('mengembalikan kosong bila tidak ada placeholder', () => {
    writeFileSync(files[2], "const a = 'bersih';\nconst b = '100 ribu';\n");
    expect(findPlaceholders([files[2]])).toHaveLength(0);
  });

  it('memindai beberapa berkas dan menggabungkan hasil', () => {
    writeFileSync(files[0], "'[ISI: a]'");
    writeFileSync(files[2], "'[ISI: b]'");
    const result = findPlaceholders([files[0], files[2]]);
    expect(result).toHaveLength(2);
  });

  it('mengabaikan berkas yang tidak bisa dibaca tanpa melempar', () => {
    const missing = path.join(tmp, 'tidak-ada.ts');
    expect(() => findPlaceholders([missing])).not.toThrow();
    expect(findPlaceholders([missing])).toHaveLength(0);
  });
});

describe('containsPlaceholder', () => {
  it('benar bila salah satu nilai memuat [ISI:', () => {
    expect(containsPlaceholder('ok', '[ISI: x]')).toBe(true);
    expect(containsPlaceholder('bersih')).toBe(false);
    expect(containsPlaceholder('a', 'b', 'c')).toBe(false);
  });
});

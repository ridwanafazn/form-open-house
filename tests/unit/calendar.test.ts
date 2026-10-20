import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildCalendar } from '../../src/lib/calendar';

describe('buildCalendar', () => {
  let blobParts: object[];
  let objectUrls: string[];

  beforeEach(() => {
    blobParts = [];
    objectUrls = [];
    (globalThis as Record<string, unknown>).Blob = class Blob {
      parts: unknown[];
      type: string;
      constructor(parts: string[], opts: { type: string }) {
        this.parts = parts;
        this.type = opts.type;
      }
    };
    (globalThis as Record<string, unknown>).URL = {
      createObjectURL: (b: { parts: unknown[] }) => {
        blobParts = b.parts;
        objectUrls.push('blob:mock');
        return 'blob:mock';
      },
    };
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>).Blob;
    delete (globalThis as Record<string, unknown>).URL;
  });

  it('menghasilkan href blob dan nama unduhan', () => {
    const r = buildCalendar();
    expect(r.href).toBe('blob:mock');
    expect(r.download).toBe('open-house.ics');
  });

  it('berisi header dan event yang valid dengan tanggal/ jam dari config', () => {
    buildCalendar();
    const ics = blobParts.join('');
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('DTSTART:20261107T080000');
    expect(ics).toContain('DTEND:20261107T150000');
    expect(ics).toContain('SUMMARY:Open House SMKIT As Syifa');
  });
});

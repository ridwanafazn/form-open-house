import { describe, it, expect, beforeEach } from 'vitest';
import { readParamsFromUrl, getStoredTracking, captureTracking } from '../../src/lib/utm';

const KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
];

function makeWindow(href: string, stored: Record<string, string> = {}) {
  (globalThis as Record<string, unknown>).window = {
    location: { href },
    sessionStorage: new FakeStorage(stored),
  };
}

class FakeStorage {
  private map: Record<string, string>;
  constructor(initial: Record<string, string> = {}) {
    this.map = { ...initial };
  }
  getItem(key: string) {
    return this.map[key] ?? null;
  }
  setItem(key: string, value: string) {
    this.map[key] = String(value);
  }
}

beforeEach(() => {
  delete (globalThis as Record<string, unknown>).window;
});

describe('readParamsFromUrl', () => {
  it('membaca parameter UTM dan fbclid dari URL', () => {
    makeWindow('https://x.test/?utm_source=instagram&utm_campaign=tes&fbclid=abc');
    expect(readParamsFromUrl()).toEqual({
      utm_source: 'instagram',
      utm_campaign: 'tes',
      fbclid: 'abc',
    });
  });
  it('kosong bila tidak ada parameter', () => {
    makeWindow('https://x.test/');
    expect(readParamsFromUrl()).toEqual({});
  });
});

describe('getStoredTracking', () => {
  it('mengembalikan hanya nilai yang tersimpan', () => {
    makeWindow('https://x.test/', { utm_source: 'facebook' });
    expect(getStoredTracking()).toEqual({ utm_source: 'facebook' });
  });
});

describe('captureTracking', () => {
  it('menyimpan parameter baru dari URL', () => {
    makeWindow('https://x.test/?utm_source=instagram&utm_campaign=tes');
    const r = captureTracking();
    expect(r.utm_source).toBe('instagram');
    expect(r.utm_campaign).toBe('tes');
  });
  it('tidak menimpa nilai lama yang sudah tersimpan', () => {
    makeWindow('https://x.test/?utm_source=baru', { utm_source: 'lama' });
    const r = captureTracking();
    expect(r.utm_source).toBe('lama');
  });
  it('menyimpan lampau sebagai gabungan nilai lama dan baru', () => {
    makeWindow('https://x.test/?utm_campaign=baru&utm_medium=ig', {
      utm_source: 'lama',
    });
    const r = captureTracking();
    expect(r).toEqual({ utm_source: 'lama', utm_campaign: 'baru', utm_medium: 'ig' });
  });
});

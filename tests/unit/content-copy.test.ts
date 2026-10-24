import { describe, expect, it } from 'vitest';
import { content } from '../../src/config/content';

// Contract: user-visible copy is the ORIGINAL wording (pre-restyle, commit 1125aeb).
// If a string changes again without an explicit user request, this test fails.
describe('original copywriting is preserved', () => {
  it('hero uses the original tagline, info line, and CTA', () => {
    expect(content.home.hero.tagline).toBe('Datang, lihat langsung, dan coba sendiri.');
    expect(content.home.hero.info).toBe(
      'Sabtu, 07 November 2026, 08.00 sampai 15.00 WIB, Jalancagak, Subang. Gratis.',
    );
    expect(content.home.hero.cta).toBe('Daftar Hadir Open House');
  });

  it('hero no longer carries the restyle-only kicker and CTA note', () => {
    expect(content.home.hero).not.toHaveProperty('kicker');
    expect(content.home.hero).not.toHaveProperty('ctaNote');
  });

  it('story, incentive, form, and footer use the original wording', () => {
    expect(content.home.story.map((s) => s.heading)).toEqual([
      'Jurusan',
      'Kelas dan lab',
      'Asrama',
      'Konsultasi',
    ]);
    expect(content.home.story[0].text).toBe('Dengar langsung pemaparan jurusan RPL dan DKV di aula.');
    expect(content.home.incentive.heading).toBe('Daftar saat open house, biayanya lebih ringan');
    expect(content.home.incentive.laterNote).toBe(
      'Jika hadir tetapi mendaftar belakangan, biayanya Rp300 ribu.',
    );
    expect(content.home.eventInfo.openMap).toBe('Buka Google Maps');
    expect(content.home.eventInfo.addCalendar).toBe('Tambah ke kalender');
    expect(content.home.rundown.tagline).toBe('Jadwal kegiatan open house dari pagi hingga selesai.');
    expect(content.home.form.heading).toBe('Daftar hadir');
    expect(content.home.form.tagline).toBe('Cukup dua langkah, tidak sampai satu menit.');
    expect(content.home.footer.text).toBe('Ada pertanyaan sebelum datang? Hubungi admisi lewat WhatsApp.');
    expect(content.home.footer.cta).toBe('Chat admisi');
  });
});

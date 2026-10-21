import { test, expect, type Page, type Route } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helper: stub endpoint /api/register agar tidak perlu Supabase nyata
// ---------------------------------------------------------------------------
async function stubRegisterOk(page: Page) {
  await page.route('**/api/register', (route: Route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }),
  );
}

async function stubRegisterError(page: Page, status = 500) {
  await page.route('**/api/register', (route: Route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, code: 'server' }),
    }),
  );
}

// Stub Turnstile: simulasikan widget yang langsung memberikan token palsu
async function stubTurnstile(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { turnstile: unknown }).turnstile = {
      render(el: HTMLElement, opts: { callback?: (token: string) => void }) {
        el.innerHTML = '<div data-testid="turnstile-stub" style="height:65px;background:#eee"></div>';
        if (opts.callback) opts.callback('test-token-stub');
      },
    };
  });
}

// ---------------------------------------------------------------------------
// Helper: isi langkah 1 form dengan data valid
// ---------------------------------------------------------------------------
async function fillStepOne(page: Page) {
  // Gunakan pressSequentially agar React synthetic onChange selalu terpanggil
  await page.locator('#f-child_name').click();
  await page.locator('#f-child_name').pressSequentially('Budi Santoso', { delay: 20 });
  await page.locator('#f-parent_phone').click();
  await page.locator('#f-parent_phone').pressSequentially('081234567890', { delay: 20 });
}

// ---------------------------------------------------------------------------
// Helper: isi langkah 2 form dengan data valid
// ---------------------------------------------------------------------------
async function fillStepTwo(page: Page) {
  // Stepper jumlah hadir sudah bawaan 2, tidak perlu diubah
  await page.locator('#f-city').click();
  await page.locator('#f-city').pressSequentially('Subang', { delay: 10 });
  await page.locator('#f-school').click();
  await page.locator('#f-school').pressSequentially('SMP Negeri 1 Subang', { delay: 10 });
  // Pilih chip jurusan RPL
  await page.click('button[aria-pressed="false"]:has-text("RPL")');
  // Centang persetujuan
  await page.click('label.consent input[type="checkbox"]');
}

// ---------------------------------------------------------------------------
// Navigasi ke halaman utama dan scroll ke form
// ---------------------------------------------------------------------------
async function gotoForm(page: Page) {
  await page.goto('/');
  // Scroll ke section form agar client:visible trigger hydration
  await page.locator('#form').scrollIntoViewIfNeeded();
  // Tambah scroll manual untuk memastikan threshold IntersectionObserver terpenuhi
  await page.evaluate(() => {
    document.getElementById('form')?.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  // Tunggu form hydrate — input nama anak harus bisa diisi
  await page.locator('#f-child_name').waitFor({ state: 'visible', timeout: 15000 });
}

// ===========================================================================
// TEST 1: Nomor HP tidak valid → pesan error muncul, tidak pindah ke langkah 2
// ===========================================================================
test('nomor HP tidak valid menampilkan pesan error dan tidak berpindah langkah', async ({ page }) => {
  await stubTurnstile(page);
  await gotoForm(page);

  await page.fill('#f-child_name', 'Budi Santoso');
  await page.fill('#f-parent_phone', '12345'); // nomor tidak valid
  await page.click('button:has-text("Lanjut")');

  // Pesan error nomor HP muncul
  const errMsg = page.locator('.err').filter({ hasText: /nomor hp|nomor|belum sesuai/i });
  await expect(errMsg).toBeVisible();

  // Masih di langkah 1 — tombol Lanjut masih ada, tombol Kirim tidak ada
  await expect(page.locator('button:has-text("Lanjut")')).toBeVisible();
  await expect(page.locator('button:has-text("Kirim")')).toHaveCount(0);
});

// ===========================================================================
// TEST 2: Nama anak terlalu pendek → pesan error
// ===========================================================================
test('nama anak terlalu pendek menampilkan pesan error', async ({ page }) => {
  await stubTurnstile(page);
  await gotoForm(page);

  await page.fill('#f-child_name', 'A'); // kurang dari 2 huruf setelah trim
  await page.fill('#f-parent_phone', '081234567890');
  await page.click('button:has-text("Lanjut")');

  const errMsg = page.locator('.err').filter({ hasText: /nama minimal/i });
  await expect(errMsg).toBeVisible();
  await expect(page.locator('button:has-text("Lanjut")')).toBeVisible();
});

// ===========================================================================
// TEST 3: Form dua langkah valid → pindah ke /terima-kasih
// ===========================================================================
test('form dua langkah valid dikirim dan berpindah ke halaman terima kasih', async ({ page }) => {
  await stubRegisterOk(page);
  await stubTurnstile(page);
  await gotoForm(page);

  // Langkah 1
  await fillStepOne(page);
  await page.click('button:has-text("Lanjut")');

  // Langkah 2 muncul — tunggu lebih lama karena ada animasi AnimatePresence
  await expect(page.locator('#f-city')).toBeVisible({ timeout: 8000 });

  // Langkah 2
  await fillStepTwo(page);

  // Kirim pendaftaran
  await page.click('button[type="submit"]:has-text("Kirim")');

  // Harus pindah ke halaman terima kasih
  await expect(page).toHaveURL(/terima-kasih/, { timeout: 10000 });
  await expect(page.locator('h1')).toContainText(/terima kasih/i);
});

// ===========================================================================
// TEST 4: Kembali dari langkah 2 ke langkah 1 → data langkah 1 tidak hilang
// ===========================================================================
test('kembali dari langkah 2 ke langkah 1 mempertahankan isian', async ({ page }) => {
  await stubTurnstile(page);
  await gotoForm(page);

  await page.locator('#f-child_name').click();
  await page.locator('#f-child_name').pressSequentially('Citra Dewi', { delay: 10 });
  await page.locator('#f-parent_phone').click();
  await page.locator('#f-parent_phone').pressSequentially('08112345678', { delay: 10 });
  await page.locator('#f-parent_name').click();
  await page.locator('#f-parent_name').pressSequentially('Dewi Lestari', { delay: 10 });
  await page.click('button:has-text("Lanjut")');

  // Di langkah 2
  await expect(page.locator('#f-city')).toBeVisible({ timeout: 8000 });

  // Kembali
  await page.click('button:has-text("Kembali")');

  // Data langkah 1 masih terisi
  await expect(page.locator('#f-child_name')).toHaveValue('Citra Dewi');
  await expect(page.locator('#f-parent_phone')).toHaveValue('08112345678');
  await expect(page.locator('#f-parent_name')).toHaveValue('Dewi Lestari');
});

// ===========================================================================
// TEST 5: Persetujuan tidak dicentang → pesan error consent
// ===========================================================================
test('kirim tanpa persetujuan menampilkan pesan error consent', async ({ page }) => {
  await stubTurnstile(page);
  await gotoForm(page);

  await fillStepOne(page);
  await page.click('button:has-text("Lanjut")');
  await expect(page.locator('#f-city')).toBeVisible({ timeout: 8000 });

  await page.locator('#f-city').click();
  await page.locator('#f-city').pressSequentially('Subang', { delay: 10 });
  await page.locator('#f-school').click();
  await page.locator('#f-school').pressSequentially('SMP Negeri 1 Subang', { delay: 10 });
  // TIDAK centang consent
  await page.click('button[type="submit"]:has-text("Kirim")');

  const errMsg = page.locator('.err').filter({ hasText: /centang/i });
  await expect(errMsg).toBeVisible();
  // Masih di halaman utama
  await expect(page).not.toHaveURL(/terima-kasih/);
});

// ===========================================================================
// TEST 6: Server error → pesan error server muncul, tidak pindah halaman
// ===========================================================================
test('gagal server menampilkan pesan error dan tidak berpindah halaman', async ({ page }) => {
  await stubRegisterError(page, 500);
  await stubTurnstile(page);
  await gotoForm(page);

  await fillStepOne(page);
  await page.click('button:has-text("Lanjut")');
  await expect(page.locator('#f-city')).toBeVisible({ timeout: 8000 });

  await fillStepTwo(page);
  await page.click('button[type="submit"]:has-text("Kirim")');

  const errMsg = page.locator('.err.submit-err');
  await expect(errMsg).toBeVisible();
  await expect(page).not.toHaveURL(/terima-kasih/);
});

// ===========================================================================
// TEST 7: Halaman terima kasih tampil baik tanpa ringkasan sessionStorage
// ===========================================================================
test('halaman terima kasih tampil tanpa ringkasan sessionStorage', async ({ page }) => {
  // Buka langsung tanpa melalui form
  await page.goto('/terima-kasih');
  await expect(page.locator('h1')).toContainText(/terima kasih/i);
  // Teks fallback muncul (tanpa nama anak)
  await expect(page.locator('.ty-summary')).toContainText(/Kami tunggu Bapak dan Ibu/i, { timeout: 5000 });
});

// ===========================================================================
// TEST 8: Progress bar — langkah 1 aktif di awal, langkah 1 selesai saat step 2
// ===========================================================================
test('progress bar menunjukkan langkah aktif yang benar', async ({ page }) => {
  await stubTurnstile(page);
  await gotoForm(page);

  // Langkah 1 harus aktif
  const step1 = page.locator('ol.progress li').nth(0);
  const step2 = page.locator('ol.progress li').nth(1);
  await expect(step1).toHaveClass(/active/);
  await expect(step2).not.toHaveClass(/active/);

  // Pindah ke langkah 2
  await fillStepOne(page);
  await page.click('button:has-text("Lanjut")');
  await expect(page.locator('#f-city')).toBeVisible({ timeout: 5000 });

  // Langkah 1 done, langkah 2 aktif
  await expect(step1).toHaveClass(/done/);
  await expect(step2).toHaveClass(/active/);
});

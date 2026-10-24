# Plan: Align public pages to the floating-navbar design language

## Goal

Make `/`, `/e-ticket/[code]`, `/privasi`, and `/terima-kasih` share one design character anchored on the current thick floating navbar — with a Dribbble-quality form and footer, working nav anchors, and the ORIGINAL copywriting restored verbatim (undo the AI-flavored rewrite from commit `16e5bc4`).

## Current context / assumptions

- Repo: `C:\Users\Ridwan\Git\form-open-house` (Astro 7 + React islands + Tailwind v4 vite plugin, Cloudflare adapter). Clean tree on `main` at `16e5bc4`.
- Read `docs/AGENTS.md` first. Hard rules that constrain this work: visual style must be **doff** — NO gradients, blur, glass, shadows, glow, or emoji; code/comments/commit messages in English; web copy in Bahasa Indonesia; never invent school facts; after each task add one line to `docs/PROGRESS.md` and commit.
- The user likes the current **floating navbar** (`src/components/FloatingNav.astro`): solid white surface, 1px `#e2e8f0` border, 16px radius, min-height 68px, DM Sans 600 links, dark `#0f172a` "Admisi" pill. That component is the design-language anchor. **A reference screenshot from the user is still pending — Task 0 ingests it.** Do not start styling tasks before the screenshot is attached.
- The phrase "Sustainable Muslim Living" appears nowhere in the repo; it is part of the screenshot reference. It must NOT be copied into the site (user calls it AI slop). All displayed copy comes from `src/config/content.ts` only.
- Root cause of "copywriting jelek": commit `16e5bc4` rewrote user-visible strings in `src/config/content.ts` (e.g. tagline `'Lihat langsung. Coba sendiri. Tanya sepuasnya.'`, story headings `'Kenalan dengan jurusannya'`, form heading `'Amankan tempat Bapak/Ibu'`, footer `'Masih ada yang ingin ditanyakan...'`). The original strings live at commit `1125aeb:src/config/content.ts` — that is the copy to restore. This is a copy-only revert; keep the newer layout structure (hero chips, price cards) and feed it original sentences.
- Root cause of "navbar click scrolls too far down": the offset is applied TWICE — `html { scroll-padding-top: 104px }` (`src/styles/global.css:112`) AND `[id] { scroll-margin-top: 104px }` (`src/styles/global.css:115-117`). Per CSS spec these stack, so anchors land ~208px below the nav instead of ~104px.
- Styling duplication (violates DRY, causes the "ugly buttons"): `.button` is defined twice — `src/styles/global.css:205` (radius `--radius` 6px) and scoped in `src/components/ui/Button.astro:40` (border ink, teal bg, paper text). The two disagree, so buttons look different depending on where they render.
- Commands on this Windows host: run pnpm via corepack — `C:/Users/Ridwan/AppData/Local/Author\ Software/nvm/.nodejs/corepack.exe pnpm <cmd>`. Plain `pnpm.exe` is broken here.
- `pnpm run build` runs `scripts/check-placeholders.mjs` (fails on `[ISI: ...]` placeholders) — copy edits must not introduce placeholders.

## Architecture / proposed approach

Single-pass restyle of the public surface around tokens: extend `src/styles/global.css` with an admin-flavored token set (surface white, border slate, radius 12–16px, bold weights) that mirrors `FloatingNav.astro`/`src/styles/admin.css`, move ALL button styling into `global.css` as the single source (Button.astro keeps only markup), fix the anchor offset by keeping exactly one mechanism, restore original copy in `src/config/content.ts` against a unit-test contract, then restyle RegisterForm, footer, and the three secondary pages to consume the same classes. No new packages (docs/TRD.md allowlist); no changes to validation, submit, or API logic.

## Step-by-step tasks

Work in order; one commit per task; each commit message in English; append one line to `docs/PROGRESS.md` per task. Dev server for visual checks: `corepack.exe pnpm dev` (serves on localhost:4321).

### Task 0 — Ingest the reference screenshot (DONE — screenshot received)

Reference: `smile-festival.pages.dev` (SMILE FEST "Ringkai Binar"), screenshot `clip_20261024_100224_6.png`.

#### Reference tokens (from the screenshot)

- **Background:** warm ivory/off-white with a faint square grid — same concept as our `--paper` + `--paper-grid`; keep ours.
- **Floating navbar (the part the user likes — "lebih tebal"):** one large white pill card spanning ~80% viewport width, fully-rounded ends (radius ≈ 40px, or 999px pill), floats ~16-24px from the top, soft drop shadow, generous height (~76-88px). Contents: left brand (logo mark + **serif** wordmark), center nav links where the ACTIVE link sits in a light-gray rounded pill ("Beranda"), right end a solid near-black pill CTA with a ticket icon ("Dapatkan Tiket").
- **Kicker badge:** small white pill with a leading dot, uppercase letter-spaced label ("• SUSTAINABLE MUSLIM LIVING") — copy itself is EXCLUDED (user: AI slop), the pill treatment is kept. We can reuse our `eventConfig` facts in this badge (e.g. "• BOARDING SCHOOL · JALANCAGAK, SUBANG" or "• GRATIS").
- **Hero type:** very large high-contrast SERIF display, two-tone — line 1 in near-black upright, lines 2-3 in olive/sage-green *italic* serif. Current stack (Space Grotesk/DM Sans) has no serif; this is the biggest visual delta.
- **Info cards:** two white rounded cards (radius ≈ 20-24px, soft shadow), each with a square icon tile (light gray bg, rounded, calendar/pin icon), bold title line, muted sub-line. Maps well onto our event info / date-location display.
- **CTA:** large near-black pill button with icon, matching the navbar CTA — dark pill, NOT teal.
- **Section pagination:** vertical dot indicators fixed at right edge (scrollytelling affordance) — optional, YAGNI unless user asks.

#### Decisions

1. **Conflict with `docs/AGENTS.md` doff rule:** RESOLVED by user (2026-10-24): option (a) — fully matte, NO shadows anywhere; floating navbar, info cards, and form cards use the 1px border recipe (white surface + `--paper-grid`-family border, radius 16-40px) instead of the reference's soft shadows.
2. **Fonts:** add a self-hosted OFL serif display for headings only (e.g. Fraunces or Playfair Display, same woff2 pattern as `src/styles/global.css:1-34`), italic for the olive lines; body stays DM Sans; navbar wordmark switches to the serif. `docs/TRD.md` package allowlist is untouched (fonts are assets, not packages).
3. **Color:** keep our teal/maroon/gold identity; adopt the reference's *dark neutral pill CTA* (near-black `--ink`) as the primary button so it matches the navbar "Admisi" pill; olive/sage accent ≈ reuse `--teal-dark` muted with italic serif for the two-tone hero.
4. All other tasks (copy restore, anchor fix, button system, form, footer, mobile) are unchanged by this sheet; Task 4's primary button becomes the dark pill (`.button--primary { background: var(--ink) }`) with teal-dark as hover/accent variant — align with user's "suka yang gelap tebal" taste shown in the navbar.

Verification: ~~token sheet pending~~ **token sheet filled above**; decision (1) asked in `docs/QUESTIONS.md`.

### Task 1 — Copy contract test (TDD, RED first)

1. Create `tests/unit/content-copy.test.ts` (follow the style of existing files in `tests/unit/`; vitest):

```ts
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

  it('story, incentive, form, and footer use the original wording', () => {
    expect(content.home.story[0].heading).toBe('Jurusan');
    expect(content.home.story[0].text).toBe('Dengar langsung pemaparan jurusan RPL dan DKV di aula.');
    expect(content.home.incentive.heading).toBe('Daftar saat open house, biayanya lebih ringan');
    expect(content.home.form.heading).toBe('Daftar hadir');
    expect(content.home.form.tagline).toBe('Cukup dua langkah, tidak sampai satu menit.');
    expect(content.home.footer.text).toBe('Ada pertanyaan sebelum datang? Hubungi admisi lewat WhatsApp.');
    expect(content.home.footer.cta).toBe('Chat admisi');
  });
});
```

2. Run: `C:/Users/Ridwan/AppData/Local/Author\ Software/nvm/.nodejs/corepack.exe pnpm test` — expect the new test to FAIL (current copy is the rewritten one). Do not implement yet; the failure is the point.
3. Commit: `test: pin original public copywriting in contract test`.

### Task 2 — Restore original copy (GREEN)

Edit `src/config/content.ts` so every string in the contract matches commit `1125aeb`. Source of truth: `git show 1125aeb:src/config/content.ts`. Rules:

- Restore verbatim: `meta`, `home.hero.tagline/info/cta`, all `home.story` items, `home.incentive.heading/text/note`, `home.eventInfo`, `home.rundown.tagline`, `home.form.heading/tagline`, `home.footer`.
- Keys that only exist post-restyle keep their key but get original-copy values, so the newer layout keeps working:
  - `hero.kicker`: delete the key and remove `<p class="hero__kicker">` from `src/components/Hero.astro` (original had no kicker).
  - `hero.ctaNote`: delete the key and remove `<p class="hero__cta-note">` from `Hero.astro`.
  - `incentive.laterNote` (used by the "Daftar belakangan" price card in `src/pages/index.astro:53`): set to the original sentence `'Jika hadir tetapi mendaftar belakangan, biayanya Rp300 ribu.'`
- Do NOT touch `form.*`, `errors.*`, `thankyou.*`, `privacy.*`, `waMessage.*` — they already match `1125aeb`.
- Hero hero__chips stay (they render `eventConfig` facts, not copy).

Verification: `corepack.exe pnpm test` → all green including the new contract test; `corepack.exe pnpm build` → passes placeholder check. Commit: `fix: restore original public copywriting`.

### Task 3 — Fix nav anchor scroll offset (TDD)

1. RED: create `tests/e2e/anchor-scroll.spec.ts` (Playwright; mirror config of existing specs in `tests/e2e/`):

```ts
import { expect, test } from '@playwright/test';

// Clicking a top-nav link must land the section heading just below the
// floating nav (nav bottom = 20px top + 68px height = 88px), not ~208px down.
for (const [label, id] of [
  ['Info Acara', 'event-info-title'],
  ['Rundown', 'rundown-title'],
] as const) {
  test(`nav "${label}" lands its heading below the nav, not far down`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.getByRole('link', { name: label }).click();
    await expect(page.locator(`#${id}`)).toBeInViewport();
    const box = await page.locator(`#${id}`).boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(88);
    expect(box!.y).toBeLessThanOrEqual(160);
  });
}
```

2. Run `corepack.exe pnpm test:e2e -- anchor-scroll` (dev server must be running or use the existing webServer config) → expect FAIL (y ≈ 208).
3. GREEN: in `src/styles/global.css` keep ONE mechanism. Delete the `[id] { scroll-margin-top: 104px }` rule (lines 115-117) and reduce `html { scroll-padding-top }` to a token:

```css
:root {
  /* Floating nav: 20px top offset + 68px min-height + 16px breathing room. */
  --nav-offset: 104px;
}
html {
  scroll-behavior: smooth;
  scroll-padding-top: var(--nav-offset);
}
```

4. Run the spec again → both tests pass. Also click-test in the browser at 390px width once (hamburger menu → same assertions hold).
5. Commit: `fix: single scroll offset for anchor navigation`.

### Task 4 — One button system (DRY)

1. Move all button styling into `src/styles/global.css`; delete the scoped `<style>` block from `src/components/ui/Button.astro` (keep its markup/logic). New doff button spec, aligned with the navbar's "Admisi" pill but page-wide and matte:

```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: 12px 22px;
  border: 1px solid transparent;
  border-radius: 12px;
  font-family: var(--font-body);
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.2;
  text-decoration: none;
  cursor: pointer;
  min-height: 46px;
  appearance: none;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}
.button--primary {
  border-color: var(--teal-dark);
  background: var(--teal-dark);
  color: #ffffff;
}
.button--primary:hover { background: #0c5c58; border-color: #0c5c58; }
.button--secondary {
  border-color: var(--ink);
  background: transparent;
  color: var(--ink);
}
.button--secondary:hover { border-color: var(--teal-dark); color: var(--teal-dark); }
.button:disabled { opacity: 0.5; cursor: not-allowed; }
```

(No `transform: translateY` press effect and no shadows — doff rule; the old `:active { transform }` is removed everywhere, including the `.sticky-cta` rule in `src/pages/index.astro:595`.)

2. Delete the duplicate `.button`/`.button--primary`/`.button--secondary` blocks at `src/styles/global.css:73-100` and `205-244` so exactly one definition remains. Sweep for other inline button restyles (grep `\.button` across `src/`) and align them: `terima-kasih.astro`, `privasi.astro`, e-ticket styles keep using the shared classes only.
3. Verify: `corepack.exe pnpm lint && corepack.exe pnpm build` pass; visually check `/` and `/terima-kasih` buttons are identical. Commit: `refactor: single doff button system in global css`.

### Task 5 — Form redesign (the "Dribbble-quality" pass)

Constraints: keep `RegisterForm.tsx` logic (state, `validateRegistration`, submit, honeypot) untouched; doff (no shadows/gradients); copy comes from `content.form` only. Look at 3–5 Dribbble "multi-step form" shots for layout ideas only (structure/spacing, not colors) — reference them in the commit message. Design:

- Wrap each step in a white card: `background: #ffffff; border: 1px solid var(--paper-grid); border-radius: 16px; padding: var(--space-6);` — same card recipe as `FloatingNav`/price cards.
- Replace underline inputs (`src/components/ui/Field.astro`): boxed inputs, 48px tall, `border: 1px solid var(--paper-grid); border-radius: 12px; background: #ffffff; padding: 0 14px;` label above in DM Sans 600 (drop the `font-style: italic`), helper in `--ink-soft` 0.85rem; focus: `border-color: var(--teal-dark)` + `outline: none` (matte, no ring glow). Error state: `border-color: var(--error)` + error text below.
- `attendee_count`: segmented control (1–5, "6+") instead of a number input — buttons row, selected = `--teal-dark` bg/white text, unselected = white/slate border.
- `interest_major`: three selectable chips/cards (RPL, DKV, Belum tahu) same selected recipe as the stepper.
- `consent_wa`: checkbox inside a bordered card row with the privacy link inline; the whole row is the tap target (44px min-height).
- Step progress: two labeled segments ("Data anak", "Kehadiran") with a filled `--teal-dark` bar under the active one, replacing any plain text progress.
- Submit button spans full card width on mobile (`width: 100%` under 640px).
- Check the rest of `RegisterForm.tsx` (lines 120-417) for its current markup/classes and restyle in place; if it renders `Field.astro`, the boxed style must come via shared classes so React islands pick it up (Astro scoped styles do NOT reach React children — put field styles in `global.css` too).

Verification: `corepack.exe pnpm test` green; submit a real entry on `localhost:4321` (dev) with validation errors forced (empty name) to see error styling; screenshot at 390px and 1280px. Commit: `feat: redesign registration form with boxed fields and segmented controls`.

### Task 6 — Footer redesign

Replace the current ink band (`src/pages/index.astro:125-141` + `.site-footer` styles at 536-573) with a footer matching the floating-card language, still doff:

- Full-width band `background: var(--ink); color: var(--paper); padding-block: var(--space-12);` but structured as 3 columns on ≥760px: (1) brand — logo image 32px + "SMKIT As Syifa Boarding School" in Space Grotesk + `content.home.footer.text`; (2) "Tautan" column — links: Info Acara (`/#event-info`), Rundown (`/#rundown`), Daftar (`/#form`), Kebijakan privasi (`/privasi`); (3) "Kontak" column — the `Chat Admisi` WhatsApp button (`button--primary`) plus admission number from `eventConfig.admissionWhatsApp`.
- Bottom bar separated by `1px solid rgba(244,239,228,0.2)`: `© 2026 SMKIT As Syifa Boarding School` left, "Kebijakan privasi" right; stacks on mobile.
- Link colors `#dce5df`, hover `#ffffff`; no social icons, no emoji.

Verification: `pnpm build` passes; mobile 390px stacks correctly (screenshot). Commit: `feat: restructure site footer into three columns`.

### Task 7 — Mobile pass across the four pages

- In `src/styles/global.css` add a 720px breakpoint pass: `.section { padding-block: var(--space-8) }`, hero title already clamps — verify chips wrap (they are `hero__chip` list items; allow `flex-wrap`), price grid stays 1-col, info-grid 1-col, form card padding `var(--space-4)`.
- Verify `FloatingNav` mobile menu still opens above the new hero (z-index 50 unchanged) and the sticky CTA pill uses the new button spec (it duplicates styles at `index.astro:576-606` — align border-radius to 12px or point it at `.button` classes instead).
- Check each page at 390px in the browser: `/`, `/privasi`, `/terima-kasih`, `/e-ticket/OH-K8VB7N` (any valid code, or seed one per `docs/SETUP.MD`). Fix overflow (no horizontal scrollbar: `document.documentElement.scrollWidth <= window.innerWidth` in console).
- Commit: `fix: mobile polish across public pages`.

### Task 8 — Align the secondary pages (privasi, terima-kasih, e-ticket)

- `src/pages/privasi.astro`: keep all legal copy; restyle the prose container to the card recipe (white card, 16px radius, 1px border, max-width 720px), same kicker/h1 treatment as `terima-kasih.astro`.
- `src/pages/terima-kasih.astro`: replace its ad-hoc `.ty__*` styling with the shared section-head + card classes; buttons already shared from Task 4; ticket card (`TicketCard.tsx`) inherits admin styling — verify it visually matches the new language (it already uses admin tokens; only adjust page spacing if needed).
- `src/pages/e-ticket/[code].astro` + `src/components/PublicTicket.tsx`: keep the admin-token look (user accepted it), just confirm buttons/back-link use the shared `.button` classes where applicable; page background stays `#eef4f5` (admin-like) — do NOT paper-grid it, this page is intentionally admin-flavored.
- Definition of done for "selaraskan karakter": same fonts (DM Sans/Space Grotesk), same radius family (12px controls, 16px cards), same border color family, same button system, no gradients/shadows — on all four routes.
- Verify: screenshot all four routes at 1280px and 390px; `pnpm lint && pnpm test && pnpm build` green. Commit: `style: align secondary pages with shared design language`.

### Task 9 — Final gate

1. `corepack.exe pnpm lint && corepack.exe pnpm test && corepack.exe pnpm build && corepack.exe pnpm format` — all must pass with no new errors.
2. Run the full e2e suite: `corepack.exe pnpm test:e2e`.
3. `git status` clean; every task has its `docs/PROGRESS.md` line.

## Tests / validation summary

- Unit: `tests/unit/content-copy.test.ts` (copy contract, Task 1-2). Full suite: `corepack.exe pnpm test`.
- E2E: `tests/e2e/anchor-scroll.spec.ts` (Task 3). Full suite: `corepack.exe pnpm test:e2e`.
- Build: `corepack.exe pnpm build` (includes placeholder check).
- Visual: screenshots of the four routes at 390px and 1280px compared against the Task 0 token sheet.

## Risks, tradeoffs, open questions

- **Blocking: reference screenshot.** Tasks 4-8 bake in concrete tokens; if the screenshot contradicts them (e.g. different radius/color), Task 0's token sheet wins and earlier styling tasks get a follow-up patch commit. Do not start Task 4+ before the screenshot arrives.
- **Copy revert vs new layout:** keeping keys like `incentive.laterNote` with original sentences is a compromise; if the user wants the layout ALSO reverted to the pre-restyle structure, that is a separate request — do not do it silently.
- **React islands + Astro scoping:** field/button styles used inside `RegisterForm.tsx` must live in `global.css`; putting them only in `.astro` scoped blocks silently does nothing for the island. This is the most likely way an implementer with questionable taste "finishes" Task 5 and sees zero change.
- **Doff rule vs "Dribbble-quality":** most attractive Dribbble forms use shadows/gradient fills; they are banned here. Quality must come from spacing, hierarchy, weight, and the segmented controls — not effects. Do not import shadows to make it "pop".
- **E-ticket data:** visual check of `/e-ticket/OH-K8VB7N` needs a real ticket row in Supabase (see `docs/SETUP.MD`); if the dev DB has none, verify layout with any seeded code and note it in `docs/QUESTIONS.md` rather than faking one.
- **Open question for the user (ask during Task 0):** should the `/e-ticket` page keep its admin slate look, or fully adopt the paper/teal public look? Plan assumes "keep admin look" since the navbar that the user likes is also admin-styled.

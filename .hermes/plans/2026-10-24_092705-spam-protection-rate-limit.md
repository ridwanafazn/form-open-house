# T34 — Spam protection for `/api/register` + post-Turnstile docs sync

## Goal

Replace the CAPTCHA that T27 deleted with real server-side abuse controls (per-IP rate limit + per-phone cooldown), and sync the docs that still describe the removed Turnstile, so a script cannot flood the registrations table and trigger unlimited Fonnte WhatsApp sends.

## Current context / assumptions

- App: Astro 7 + `@astrojs/cloudflare` + React islands, deployed as a Cloudflare Worker (`wrangler.toml`, deploy = `npx wrangler deploy --config dist/server/wrangler.json`). Source of truth docs: `docs/AGENTS.md` (read first — hard rules: no new packages outside TRD allowlist, no secrets in repo, commit messages in English, add a line to `docs/PROGRESS.md` per task, one commit per task).
- **The gap:** T27 (2026-10-22) removed Turnstile entirely per owner request. The only remaining bot defense on `POST /api/register` is a hidden honeypot field (`website`). `src/lib/submitRegistration.ts` writes to Supabase REST with the **service role key** and, on success, sends a Fonnte WhatsApp message (plus exposes `/api/ticket-image?code=...` for Fonnte to fetch). A scripted loop with random phone numbers can pollute the DB and spam arbitrary WhatsApp numbers at zero cost to the attacker.
- DB: `registrations` has `unique (parent_phone, child_name_key)` — exact duplicates 409 → treated as success. Random phones bypass this. There are indexes on `created_at desc` and `parent_phone` is not individually indexed (the `unique (parent_phone, child_name_key)` constraint provides a composite btree whose leading column is `parent_phone`, so a `parent_phone=eq.X` filter is index-supported).
- `submitRegistration(parsed, env, fetchImpl)` is pure enough to unit test with a fake fetch — `tests/unit/registration.test.ts` already does this (64/64 unit tests green). Follow that pattern.
- Runtime env is read via `import { env as workerEnv } from 'cloudflare:workers'` in `src/pages/api/register.ts` (T26 pattern). `locals.runtime.env` is forbidden in Astro 6+.
- Tooling quirk on this machine: invoke pnpm via corepack, e.g.
  `C:/Users/Ridwan/AppData/Local/Author Software/nvm/.nodejs/corepack.exe pnpm test`
  (plain `pnpm.exe` nvm shim is broken). Shell is git-bash.
- Error-message plumbing that already exists: `src/config/content.ts` `errors` map (`server`, `closed`, ...) → `RegisterForm.tsx` maps a non-400 response `code` to `content.errors.<code>` (default `server`). We reuse this with a new `rate_limited` code.
- Docs drift confirmed by grep: `docs/LAUNCH.md` (Turnstile checklist items + env-var table rows), `docs/TRD.md` (env vars lines 44–57, register step 5 line 111, CSP line 170, e2e line 187, launch line 197), `docs/SETUP.MD`. `src/pages/index.astro:6` is only a comment (fine to leave). `.env.example` is already clean.

## Architecture / proposed approach

Two independent, layered defenses, both package-free:

1. **Per-IP rate limit** — a native Cloudflare Workers Rate Limiting binding (`RATE_LIMITER` in `wrangler.toml`), checked in `register.ts` before any parsing/DB work. Fails open when the binding is absent (local dev) so nothing breaks.
2. **Per-phone cooldown** — inside `submitRegistration`, after validation but before the Supabase write: one cheap indexed `count` query against `/rest/v1/registrations` for rows with the same `parent_phone` created in the last 10 minutes; if any exist, return a new `rate_limited` result → 429.

Both return `429 { ok: false, code: 'rate_limited' }`, rendered by the existing error-plumbing path with a new message in `content.ts`. Docs sync is a third, independent commit.

## Step-by-step tasks

### Task 1 — New error code + message (TDD)

**Test first.** In `tests/unit/registration.test.ts`, add:

```ts
it('returns rate_limited 429 when the same phone registered recently', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl = makeCountAwareFetch(calls); // helper below
  const result = await submitRegistration(validBody, fullEnv, fetchImpl as Fetcher);
  assert.equal(result.kind, 'error');
  if (result.kind === 'error') {
    assert.equal(result.status, 429);
    assert.equal(result.code, 'rate_limited');
  }
  // cooldown query must precede the insert
  assert.ok(calls[0].url.includes('/rest/v1/registrations?'));
  assert.ok(calls[0].url.includes('parent_phone=eq.'));
});
```

Reuse the file's existing fake-fetch helper style: a fetch that answers the first call (the cooldown `GET ...&select=id&limit=1`) with `[200, '[{"id":"existing"}]']` and fails the test if the insert `POST` is ever reached. Run:

```
C:/Users/Ridwan/AppData/Local/Author Software/nvm/.nodejs/corepack.exe pnpm test
```

Expected: **1 failing** test (unknown code / no cooldown call). Commit nothing yet.

**Implement** in `src/lib/submitRegistration.ts`, between step 4 (validate) and the payload build:

```ts
// 5. Cooldown: the same WhatsApp number may register at most once per 10 minutes.
const cooldown = await isPhoneInCooldown(
  result.value.parent_phone,
  env,
  fetchImpl,
  Date.now(),
);
if (cooldown) {
  return { kind: 'error', status: 429, code: 'rate_limited' };
}
```

And the helper (same file, uses existing `Fetcher` type):

```ts
const PHONE_COOLDOWN_MS = 10 * 60 * 1000;

/**
 * True when a registration with the same parent_phone was created recently.
 * Uses the composite index on (parent_phone, child_name_key); count-only query.
 */
export async function isPhoneInCooldown(
  phone: string,
  env: SubmitEnv,
  fetchImpl: Fetcher,
  nowMs: number,
): Promise<boolean> {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) return false;
  const since = new Date(nowMs - PHONE_COOLDOWN_MS).toISOString();
  const url =
    `${env.supabaseUrl}/rest/v1/registrations?select=id` +
    `&parent_phone=eq.${encodeURIComponent(phone)}` +
    `&created_at=gte.${encodeURIComponent(since)}` +
    '&limit=1';
  try {
    const res = await fetchImpl(url, {
      headers: {
        apikey: env.supabaseServiceRoleKey,
        Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
      },
    });
    if (!res.ok) return false; // fail open: availability over strictness
    const rows = (await res.json().catch(() => [])) as Array<unknown>;
    return rows.length > 0;
  } catch {
    return false; // never let the cooldown check take registration down
  }
}
```

Add `rate_limited` to `content.ts` `errors` (Bahasa Indonesia, no emoji, per `docs/CONTENT.md` rules):

```ts
rate_limited:
  'Nomor WhatsApp ini baru saja mendaftar. Coba lagi dalam 10 menit, atau hubungi admisi jika ada kendala.',
```

**Wire the route** — in `src/pages/api/register.ts` the `error` case already returns `result.code` for non-400 statuses; no change needed. In `RegisterForm.tsx` line ~148 the code maps to `content.errors[code]`; extend it:

```ts
setSubmitError(
  code === 'closed'
    ? content.errors.closed
    : code === 'rate_limited'
      ? content.errors.rate_limited
      : content.errors.server,
);
```

Run `... pnpm test` → expect **65/65 pass**. Run `... pnpm lint` → clean. Commit:
`feat: per-phone registration cooldown via Supabase REST`

### Task 2 — Per-IP rate limit binding in `register.ts`

Check the current Cloudflare docs for the Rate Limiting binding syntax first (AGENTS.md rule 7 — the binding is still marked as evolving; the syntax below is `[[unsafe.bindings]]` with `type = "ratelimit"`, verify before use). Append to `wrangler.toml`:

```toml
# Native Workers rate limiting (beta binding): 5 registration attempts
# per IP per 60 seconds. Local dev without the binding fails open.
[[unsafe.bindings]]
name = "RATE_LIMITER"
type = "ratelimit"
namespace_id = "1001"
simple = { limit = 5, period = 60 }
```

In `src/pages/api/register.ts`, before body-size check (cheapest rejection first):

```ts
// 0. Per-IP rate limit via native Workers binding. Absent binding (local
// dev) fails open — the per-phone cooldown in submitRegistration still applies.
const ip = request.headers.get('CF-Connecting-IP');
const limiter = (workerEnv as Record<string, unknown>).RATE_LIMITER as
  | { limit: (opts: { key: string }) => Promise<{ success: boolean }> }
  | undefined;
if (ip && limiter) {
  try {
    const { success } = await limiter.limit({ key: ip });
    if (!success) {
      return Response.json({ ok: false, code: 'rate_limited' }, { status: 429 });
    }
  } catch {
    // binding error: fail open
  }
}
```

Note on unit testing: the binding check lives in the route (it needs `request` + `workerEnv`), outside the already-tested `submitRegistration`. Keep it there — do not force it into `submitRegistration`'s signature. Manual verification instead of a unit test (see Validation). If the implementer finds `@astrojs/cloudflare` does **not** merge custom bindings from `wrangler.toml` into `dist/server/wrangler.json`, stop, verify the adaptor's binding mechanism (its README / `platformProxy` option), and record the finding in `docs/QUESTIONS.md` — do not invent a workaround.

Verify: `... pnpm build` succeeds and check the generated config contains the binding:

```
grep -c ratelimit dist/server/wrangler.json
```

Expected output: `1`. Commit: `feat: per-IP rate limit binding on register endpoint`

### Task 3 — Docs sync (remove stale Turnstile references)

Mechanical edits, grep-driven. Run first to enumerate:

```
grep -rn -i "turnstile" docs/LAUNCH.md docs/TRD.md docs/SETUP.MD
```

- `docs/TRD.md`: delete the two `PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` env lines (44–45) and the surrounding notes (lines 55–57); replace register **step 5** (line 111, siteverify) with the two new steps: "5. Cooldown per nomor WhatsApp 10 menit (count query REST Supabase). 6. Rate limit per IP lewat binding `RATE_LIMITER`; 429 kode `rate_limited`." and renumber the rest; update the CSP paragraph (line 170) to drop `challenges.cloudflare.com`; update the e2e paragraph (187) and launch checklist item (197).
- `docs/LAUNCH.md`: remove the two Turnstile checkbox items and the two Turnstile env-table rows; add a row for none (no new env vars — both defenses are code/config-side). Note `REGISTRATION_OPEN` and `FONNTE_API_TOKEN` rows already exist.
- `docs/SETUP.MD`: delete Turnstile setup steps.

Do **not** touch `docs/TASKS.md` or historical `docs/PROGRESS.md` entries. Commit: `docs: remove stale Turnstile references, document rate limiting`

### Task 4 — Progress + verification sweep

1. Full gate:
   ```
   C:/Users/Ridwan/AppData/Local/Author Software/nvm/.nodejs/corepack.exe pnpm lint
   C:/Users/Ridwan/AppData/Local/Author Software/nvm/.nodejs/corepack.exe pnpm test
   C:/Users/Ridwan/AppData/Local/Author Software/nvm/.nodejs/corepack.exe pnpm build
   C:/Users/Ridwan/AppData/Local/Author Software/nvm/.nodejs/corepack.exe pnpm test:e2e
   ```
   Expected: lint clean, 65/65 unit, build OK, e2e 9/9.
2. Append one line to `docs/PROGRESS.md` in the established format:
   `T34 | 2026-10-24 | ...` describing the cooldown, the binding, and check results.
3. Commit: `docs: record T34 progress`

## Tests / validation

TDD per task 1 (failing test → minimal implementation → green), manual verification for task 2:

- **Task 2 manual check (local):** `... pnpm dev`, then in a second terminal:
  ```
  for i in 1 2 3 4 5 6 7; do curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:4321/api/register -H "Content-Type: application/json" -d '{"website":""}'; done
  ```
  Expected with the binding active in local dev (miniflare emulates it): six `200` then `429`s. If miniflare does not emulate the binding in `astro dev`, the loop stays `200` (fail-open path) — then verify instead against `... pnpm preview` / `wrangler dev`, or accept fail-open locally and confirm the binding exists in `dist/server/wrangler.json`.
- **Regression proof for cooldown:** with dev server running, submit the same valid phone twice within 10 minutes via the real form; second submit shows the new `rate_limited` message near the submit button.
- **No-secret check (hard rule):** `grep -rn "service" dist/client/_astro/*.js | wc -l` → `0`; service key must stay server-side (it already is; the cooldown query reuses the same server-side env).

## Risks, tradeoffs, and open questions

- **Rate-limit binding syntax/availability** is the main risk: it is a beta platform feature and the adaptor's config merging must carry it into `dist/server/wrangler.json`. Mitigation: Task 2's grep check + explicit stop-and-record instruction. Fallback if unusable: skip the binding, rely on the per-phone cooldown (which alone stops Fonnte spam to a given number), and record in QUESTIONS.md.
- **Fail-open philosophy:** both checks fail open (availability over strictness). This matches the owner's "no friction for real registrants" stance from the T27 decision; a hard-down 503 during the open-house window is worse than some spam the committee can delete in `/admin`.
- **Shared NAT / school Wi-Fi:** 5 req/min per IP could momentarily throttle several registrants behind one IP; the cooldown only blocks *the same phone*, so legitimate distinct registrants are unaffected by Task 1 regardless of Task 2 behavior.
- **Not covered (YAGNI):** CAPTCHA alternatives, image/OCR challenges, an IP-log table. Revisit only if spam actually appears.
- **Open question for the owner (add to `docs/QUESTIONS.md` if implemented):** confirm 10 minutes is the right cooldown and 5/min the right IP budget before the public launch listed in `docs/LAUNCH.md`.
- Unrelated known debt, out of scope here: `waJoinUrl` still contains an `[ISI: ...]` placeholder (Q01) — a human task; `README.md` is still the Astro starter boilerplate.

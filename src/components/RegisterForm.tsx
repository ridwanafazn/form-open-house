import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'motion/react';
import { content } from '../config/content';
import { eventConfig } from '../config/event';
import { validateRegistration } from '../lib/validate';
import { trackingForSubmit } from '../lib/utm';

type Fields = {
  child_name: string;
  parent_phone: string;
  parent_name: string;
  attendee_count: number;
  city: string;
  school: string;
  interest_major: string;
  consent_wa: boolean;
  website: string; // jebakan bot (isian tersembunyi)
};

interface Props {
  turnstileSiteKey: string;
}

const { stepOne, stepTwo, consent, buttons } = content.form;

const STORAGE_SUMMARY_KEY = 'oh_summary';

export default function RegisterForm({ turnstileSiteKey }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [fields, setFields] = useState<Fields>({
    child_name: '',
    parent_phone: '',
    parent_name: '',
    attendee_count: 2,
    city: '',
    school: '',
    interest_major: '',
    consent_wa: false,
    website: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');
  const turnstileRoot = useRef<HTMLDivElement>(null);

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) =>
    setFields((f) => ({ ...f, [key]: value }));

  // Muat Turnstile saat langkah dua tampil, render ulang setiap kali masuk langkah 2.
  useEffect(() => {
    if (step !== 2) return;

    function renderWidget() {
      const win = window as unknown as {
        turnstile?: { render: (el: HTMLElement, opts: object) => void };
      };
      if (!turnstileRoot.current || !win.turnstile) return;
      // Kosongkan terlebih dulu agar tidak duplikat saat kembali ke langkah 2
      turnstileRoot.current.innerHTML = '';
      try {
        win.turnstile.render(turnstileRoot.current, {
          sitekey: turnstileSiteKey,
          callback: setToken,
        });
      } catch {
        /* abaikan */
      }
    }

    const doc = document;
    if (!doc.getElementById('cf-turnstile-src')) {
      const s = doc.createElement('script');
      s.id = 'cf-turnstile-src';
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      s.async = true;
      s.defer = true;
      s.onload = renderWidget;
      doc.head.appendChild(s);
    } else {
      renderWidget();
    }
  }, [step, turnstileSiteKey]);

  // progress: langkah 1 aktif, langkah 2 aktif saat step=2 dan sudah selesai saat kirim
  const step1Done = step === 2;
  const step2Done = false; // hanya true setelah berhasil kirim (navigasi keluar)

  function goToTwo() {
    const { ok, errors: errs } = validatePartial();
    if (!ok) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep(2);
  }

  function validatePartial() {
    const r = validateRegistration({
      child_name: fields.child_name,
      parent_phone: fields.parent_phone,
      parent_name: fields.parent_name,
    });
    const out: Record<string, string> = {};
    if (!r.errors.child_name) delete r.errors.child_name;
    if (r.errors.child_name) out.child_name = content.errors.name_short;
    if (r.errors.parent_phone) out.parent_phone = content.errors.phone;
    if (r.errors.parent_name) out.parent_name = content.errors.name_short;
    return { ok: Object.keys(out).length === 0, errors: out };
  }

  function validateAll() {
    const r = validateRegistration({
      child_name: fields.child_name,
      parent_phone: fields.parent_phone,
      parent_name: fields.parent_name,
      attendee_count: fields.attendee_count,
      city: fields.city,
      school: fields.school,
      interest_major: fields.interest_major,
      consent_wa: fields.consent_wa,
    });
    return r;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'sending') return;
    const r = validateAll();
    if (!r.ok) {
      const m = mapErrors(r.errors);
      setErrors(m);
      setSubmitError('');
      return;
    }
    setErrors({});
    setStatus('sending');
    const device = window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
    const tracking = trackingForSubmit();
    const payload = {
      child_name: r.value.child_name,
      parent_phone: r.value.parent_phone,
      parent_name: r.value.parent_name,
      attendee_count: r.value.attendee_count,
      city: r.value.city,
      school: r.value.school,
      interest_major: r.value.interest_major,
      consent_wa: r.value.consent_wa,
      turnstile_token: token,
      website: fields.website,
      ...tracking,
      referrer: document.referrer,
      device,
    };
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        try {
          sessionStorage.setItem(
            STORAGE_SUMMARY_KEY,
            JSON.stringify({
              child_name: r.value.child_name,
              attendee_count: r.value.attendee_count,
            }),
          );
        } catch {
          /* lanjut tanpa ringkasan */
        }
        window.location.href = '/terima-kasih';
        return;
      }
      const code =
        res.status === 403 && data && data.code
          ? data.code
          : res.status === 413
            ? 'server'
            : 'server';
      setStatus('idle');
      setSubmitError(
        code === 'closed' ? content.errors.closed : code === 'turnstile' ? content.errors.turnstile : content.errors.server,
      );
    } catch {
      setStatus('idle');
      setSubmitError(content.errors.server);
    }
  }

  function mapErrors(e: Record<string, string>) {
    const m: Record<string, string> = {};
    if (e.child_name) m.child_name = content.errors.name_short;
    if (e.parent_phone) m.parent_phone = content.errors.phone;
    if (e.parent_name) m.parent_name = content.errors.name_short;
    if (e.attendee_count) m.attendee_count = content.errors.attendee_count;
    if (e.city) m.city = content.errors.required;
    if (e.school) m.school = content.errors.required;
    if (e.consent_wa) m.consent_wa = content.errors.consent;
    return m;
  }

  function errorFor(key: string) {
    return errors[key] ?? '';
  }

  return (
    <LazyMotion features={domAnimation}>
      <form className="form" onSubmit={onSubmit} noValidate>
        <ol className="progress">
          <li className={step1Done ? 'done' : 'active'}>{content.home.form.progress[0]}</li>
          <li className={step === 2 ? 'active' : ''}>{content.home.form.progress[1]}</li>
        </ol>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <m.div
              key="s1"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.25 }}
            >
              <input type="text" hidden aria-hidden="true" tabIndex={-1} autoComplete="off" value={fields.website} onChange={(e) => set('website', e.target.value)} />

              <div className="field">
                <label htmlFor="f-child_name">{stepOne[0].label} <span className="req" aria-hidden="true">*</span></label>
                <input id="f-child_name" name="child_name" value={fields.child_name}
                  onChange={(e) => set('child_name', e.target.value)} placeholder={stepOne[0].helper} />
                {errorFor('child_name') && <p className="err">{errorFor('child_name')}</p>}
              </div>

              <div className="field">
                <label htmlFor="f-parent_phone">{stepOne[1].label} <span className="req" aria-hidden="true">*</span></label>
                <input id="f-parent_phone" name="parent_phone" type="tel" inputMode="tel" autoComplete="tel"
                  value={fields.parent_phone} onChange={(e) => set('parent_phone', e.target.value)} placeholder={stepOne[1].helper} />
                {errorFor('parent_phone') && <p className="err">{errorFor('parent_phone')}</p>}
              </div>

              <div className="field">
                <label htmlFor="f-parent_name">{stepOne[2].label}</label>
                <input id="f-parent_name" name="parent_name" value={fields.parent_name}
                  onChange={(e) => set('parent_name', e.target.value)} placeholder={stepOne[2].helper} />
                {errorFor('parent_name') && <p className="err">{errorFor('parent_name')}</p>}
              </div>

              <button type="button" className="button button--primary" onClick={goToTwo}>
                {buttons.next}
              </button>
            </m.div>
          ) : (
            <m.div
              key="s2"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.25 }}
            >
              <fieldset className="field">
                <legend>{stepTwo[0].label}</legend>
                <div className="stepper">
                  <button type="button" aria-label="Kurangi jumlah" onClick={() => set('attendee_count', Math.max(1, fields.attendee_count - 1))}>-</button>
                  <span className="stepper__value">{fields.attendee_count}</span>
                  <button type="button" aria-label="Tambah jumlah" onClick={() => set('attendee_count', Math.min(10, fields.attendee_count + 1))}>+</button>
                </div>
                <p className="hint">{stepTwo[0].helper}</p>
                {errorFor('attendee_count') && <p className="err">{errorFor('attendee_count')}</p>}
              </fieldset>

              <div className="field">
                <label htmlFor="f-city">{stepTwo[1].label} <span className="req" aria-hidden="true">*</span></label>
                <input id="f-city" name="city" value={fields.city} onChange={(e) => set('city', e.target.value)} placeholder={stepTwo[1].example} />
                {errorFor('city') && <p className="err">{errorFor('city')}</p>}
              </div>

              <div className="field">
                <label htmlFor="f-school">{stepTwo[2].label} <span className="req" aria-hidden="true">*</span></label>
                <input id="f-school" name="school" value={fields.school} onChange={(e) => set('school', e.target.value)} placeholder={stepTwo[2].example} />
                {errorFor('school') && <p className="err">{errorFor('school')}</p>}
              </div>

              <fieldset className="field">
                <legend>{stepTwo[3].label}</legend>
                <div className="chips">
                  {stepTwo[3].options?.map((label) => {
                    const val = label.toLowerCase().replace(/\s+/g, '_');
                    return (
                      <button
                        key={val}
                        type="button"
                        aria-pressed={fields.interest_major === val}
                        className={fields.interest_major === val ? 'chip chip--on' : 'chip'}
                        onClick={() => set('interest_major', fields.interest_major === val ? '' : val)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="hint">{stepTwo[3].helper}</p>
              </fieldset>

              <div className="field">
                <label className="consent">
                  <input type="checkbox" checked={fields.consent_wa} onChange={(e) => set('consent_wa', e.target.checked)} />
                  <span>{consent.text}</span>
                </label>
                <a href={consent.linkHref}>{consent.linkText}</a>
                {errorFor('consent_wa') && <p className="err">{errorFor('consent_wa')}</p>}
              </div>

              <div ref={turnstileRoot} className="turnstile" data-size="flexible" />

              {submitError && <p className="err submit-err">{submitError}</p>}

              <div className="actions">
                <button type="button" className="button button--secondary" onClick={() => setStep(1)}>
                  {buttons.back}
                </button>
                <button type="submit" className="button button--primary" disabled={status === 'sending'}>
                  {status === 'sending' ? buttons.submitting : buttons.submit}
                </button>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </form>

      <style>{`
        .form { display: flex; flex-direction: column; gap: var(--space-6); }
        .progress { display: flex; gap: var(--space-6); list-style: none; padding: 0; margin: 0; }
        .progress li { color: var(--ink-soft); }
        .progress li.active { color: var(--ink); font-weight: 600; }
        .progress li.done { color: var(--teal-dark); }
        .field { display: flex; flex-direction: column; gap: var(--space-1); }
        .field label { font-style: italic; }
        .req { color: var(--maroon); }
        .field input, .field select {
          width: 100%; min-height: 44px; padding: var(--space-2) 0;
          border: 0; border-bottom: var(--line) solid var(--ink);
          background: transparent; font-size: 1rem;
        }
        .field input:focus { outline: none; border-bottom-color: var(--teal-dark); }
        .err { color: var(--error); font-size: 0.9rem; }
        .hint { color: var(--ink-soft); font-size: 0.9rem; margin: 0; }
        .submit-err { margin: 0; }
        .stepper { display: flex; align-items: center; gap: var(--space-4); }
        .stepper button {
          width: 44px; height: 44px; border: var(--line) solid var(--ink);
          border-radius: var(--radius); background: var(--paper); font-size: 1.2rem; cursor: pointer;
        }
        .stepper__value { min-width: 28px; text-align: center; font-size: 1.2rem; }
        .chips { display: flex; flex-wrap: wrap; gap: var(--space-2); }
        .chip {
          min-height: 44px; padding: var(--space-2) var(--space-4);
          border: var(--line) solid var(--ink); border-radius: var(--radius);
          background: var(--paper); cursor: pointer;
        }
        .chip--on { background: var(--teal-pale); border-color: var(--teal-dark); color: var(--teal-dark); }
        .consent { display: flex; gap: var(--space-2); align-items: flex-start; font-style: normal; }
        .consent input { width: auto; margin-top: 4px; }
        .turnstile { min-height: 65px; }
        .actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
      `}</style>
    </LazyMotion>
  );
}

import { useState, useEffect } from 'react';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'motion/react';
import { content } from '../config/content';
import { eventConfig } from '../config/event';
import { validateRegistration } from '../lib/validate';
import { trackingForSubmit } from '../lib/utm';

interface RegistrationStatus {
  open: boolean;
  message: string | null;
}

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

const { stepOne, stepTwo, consent, buttons } = content.form;

const STORAGE_SUMMARY_KEY = 'oh_summary';

export default function RegisterForm() {
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
  const [status, setStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');
  const [regStatus, setRegStatus] = useState<RegistrationStatus>({ open: true, message: null });
  const [regStatusLoading, setRegStatusLoading] = useState(true);

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) =>
    setFields((f) => ({ ...f, [key]: value }));

  // Fetch registration status on mount
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/registration-status', {
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          setRegStatus({ open: data.open ?? true, message: data.message ?? null });
        }
      } catch {
        // Gagal fetch → default ke buka (fail-open untuk UX)
      } finally {
        setRegStatusLoading(false);
      }
    }
    fetchStatus();
  }, []);

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

    // Cek ulang status sebelum submit (race condition guard)
    if (!regStatus.open) {
      setSubmitError(regStatus.message || content.errors.closed);
      return;
    }

    const r = validateAll();
    if (!r.ok) {
      const m = mapErrors(r.errors);
      setErrors(m);
      setSubmitError('');
      return;
    }
    setErrors({});
    setStatus('sending');

    const device =
      window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';
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
              ticket_code: data.ticket_code || '',
              id: data.id || '',
              parent_phone: r.value.parent_phone,
            }),
          );
        } catch {
          /* lanjut tanpa ringkasan */
        }
        window.location.href = '/terima-kasih';
        return;
      }
      if (res.status === 400 && data && data.errors) {
        setStatus('idle');
        setErrors(mapErrors(data.errors as Record<string, string>));
        setSubmitError('');
        return;
      }
      const code = data && typeof data.code === 'string' ? data.code : 'server';
      setStatus('idle');
      setSubmitError(code === 'closed' ? content.errors.closed : content.errors.server);
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
    if (e.interest_major) m.interest_major = content.errors.required;
    if (e.consent_wa) m.consent_wa = content.errors.consent;
    return m;
  }

  function errorFor(key: string) {
    return errors[key] ?? '';
  }

  const formDisabled = !regStatus.open || regStatusLoading;

  return (
    <LazyMotion features={domAnimation}>
      <form className="form" onSubmit={onSubmit} noValidate>
        {regStatusLoading && (
          <m.div
            className="form-status-banner form-status-banner--loading"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <svg className="spinner" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round" />
            </svg>
            <span>Memuat status pendaftaran…</span>
          </m.div>
        )}

        {!regStatusLoading && !regStatus.open && (
          <m.div
            className="form-status-banner form-status-banner--closed"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role="alert"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>
              <strong>Pendaftaran Ditutup</strong>
              <p>{regStatus.message || content.errors.closed}</p>
            </div>
          </m.div>
        )}

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
              <input
                type="text"
                hidden
                aria-hidden="true"
                tabIndex={-1}
                autoComplete="off"
                value={fields.website}
                onChange={(e) => set('website', e.target.value)}
              />

              <div className="field">
                <label htmlFor="f-child_name">
                  {stepOne[0].label}{' '}
                  <span className="req" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  id="f-child_name"
                  name="child_name"
                  value={fields.child_name}
                  onChange={(e) => set('child_name', e.target.value)}
                  placeholder={stepOne[0].helper}
                  disabled={formDisabled}
                />
                {errorFor('child_name') && <p className="err">{errorFor('child_name')}</p>}
              </div>

              <div className="field">
                <label htmlFor="f-parent_phone">
                  {stepOne[1].label}{' '}
                  <span className="req" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  id="f-parent_phone"
                  name="parent_phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={fields.parent_phone}
                  onChange={(e) => set('parent_phone', e.target.value)}
                  placeholder={stepOne[1].helper}
                  disabled={formDisabled}
                />
                {errorFor('parent_phone') && <p className="err">{errorFor('parent_phone')}</p>}
              </div>

              <div className="field">
                <label htmlFor="f-parent_name">
                  {stepOne[2].label}{' '}
                  <span className="req" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  id="f-parent_name"
                  name="parent_name"
                  value={fields.parent_name}
                  onChange={(e) => set('parent_name', e.target.value)}
                  placeholder={stepOne[2].helper}
                  disabled={formDisabled}
                />
                {errorFor('parent_name') && <p className="err">{errorFor('parent_name')}</p>}
              </div>

              <button
                type="button"
                className="button button--primary form-next"
                onClick={goToTwo}
                disabled={formDisabled}
              >
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
                  <button
                    type="button"
                    aria-label="Kurangi jumlah"
                    onClick={() => set('attendee_count', Math.max(1, fields.attendee_count - 1))}
                    disabled={formDisabled}
                  >
                    -
                  </button>
                  <span className="stepper__value">{fields.attendee_count}</span>
                  <button
                    type="button"
                    aria-label="Tambah jumlah"
                    onClick={() => set('attendee_count', Math.min(10, fields.attendee_count + 1))}
                    disabled={formDisabled}
                  >
                    +
                  </button>
                </div>
                <p className="hint">{stepTwo[0].helper}</p>
                {errorFor('attendee_count') && <p className="err">{errorFor('attendee_count')}</p>}
              </fieldset>

              <div className="field">
                <label htmlFor="f-city">
                  {stepTwo[1].label}{' '}
                  <span className="req" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  id="f-city"
                  name="city"
                  value={fields.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder={stepTwo[1].example}
                  disabled={formDisabled}
                />
                {errorFor('city') && <p className="err">{errorFor('city')}</p>}
              </div>

              <div className="field">
                <label htmlFor="f-school">
                  {stepTwo[2].label}{' '}
                  <span className="req" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  id="f-school"
                  name="school"
                  value={fields.school}
                  onChange={(e) => set('school', e.target.value)}
                  placeholder={stepTwo[2].example}
                  disabled={formDisabled}
                />
                {errorFor('school') && <p className="err">{errorFor('school')}</p>}
              </div>

              <fieldset className="field">
                <legend>
                  {stepTwo[3].label}{' '}
                  <span className="req" aria-hidden="true">
                    *
                  </span>
                </legend>
                <div className="chips">
                  {stepTwo[3].options?.map((label) => {
                    const val = label.toLowerCase().replace(/\s+/g, '_');
                    return (
                      <button
                        key={val}
                        type="button"
                        aria-pressed={fields.interest_major === val}
                        className={fields.interest_major === val ? 'chip chip--on' : 'chip'}
                        onClick={() =>
                          set('interest_major', fields.interest_major === val ? '' : val)
                        }
                        disabled={formDisabled}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="hint">{stepTwo[3].helper}</p>
                {errorFor('interest_major') && <p className="err">{errorFor('interest_major')}</p>}
              </fieldset>

              <div className="field">
                <label className="consent">
                  <input
                    type="checkbox"
                    checked={fields.consent_wa}
                    onChange={(e) => set('consent_wa', e.target.checked)}
                    disabled={formDisabled}
                  />
                  <span>{consent.text}</span>
                </label>
                <a href={consent.linkHref}>{consent.linkText}</a>
                {errorFor('consent_wa') && <p className="err">{errorFor('consent_wa')}</p>}
              </div>

              {submitError && <p className="err submit-err">{submitError}</p>}

              <div className="actions">
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={() => setStep(1)}
                  disabled={formDisabled}
                >
                  {buttons.back}
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={status === 'sending' || formDisabled}
                >
                  {status === 'sending' ? buttons.submitting : buttons.submit}
                </button>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </form>

      <style>{`
        /* Card container: white surface + 1px border, matte (doff). */
        .form {
          display: flex; flex-direction: column; gap: var(--space-6);
          padding: var(--space-6);
          border: 1px solid var(--paper-grid); border-radius: var(--radius-card);
          background: #ffffff;
        }
        /* Segmented progress: label above a filled bar per step. */
        .progress { display: flex; gap: var(--space-2); list-style: none; padding: 0; margin: 0; }
        .progress li {
          flex: 1; position: relative; padding-bottom: 12px;
          color: var(--ink-soft); font-family: var(--font-heading);
          font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
        }
        .progress li::after {
          content: ''; position: absolute; left: 0; right: 0; bottom: 0;
          height: 4px; border-radius: 999px; background: var(--paper-grid);
        }
        .progress li.active { color: var(--ink); }
        .progress li.active::after { background: var(--teal-dark); }
        .progress li.done { color: var(--teal-dark); }
        .progress li.done::after { background: var(--teal-dark); }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .form-next { margin-top: var(--space-4); }
        .field label, .field legend {
          padding: 0; font-weight: 600; font-size: 0.92rem; color: var(--ink);
        }
        .field fieldset { border: 0; padding: 0; margin: 0; }
        .req { color: var(--maroon); }
        /* Boxed inputs: 48px tall, 12px radius, white surface, 1px border. */
        .field input {
          width: 100%; min-height: 48px; padding: 0 14px;
          border: 1px solid var(--paper-grid); border-radius: var(--radius-control);
          background: #ffffff; color: var(--ink); font-size: 1rem;
          transition: border-color 0.2s ease;
        }
        .field input:disabled,
        .field button:disabled,
        .chip:disabled,
        .consent:has(input:disabled) {
          opacity: 0.6; cursor: not-allowed;
        }
        .field input::placeholder { color: var(--ink-soft); opacity: 1; }
        .field input:focus { outline: none; border-color: var(--teal-dark); }
        .field:has(.err) input { border-color: var(--error); }
        .err { color: var(--error); font-size: 0.88rem; margin: 0; }
        .hint { color: var(--ink-soft); font-size: 0.88rem; margin: 0; }
        .submit-err { margin: 0; }
        /* Stepper: boxed 44px controls around a large count. */
        .stepper { display: flex; align-items: center; gap: var(--space-3); }
        .stepper button {
          width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center;
          border: 1px solid var(--paper-grid); border-radius: var(--radius-control);
          background: #ffffff; font-size: 1.2rem; font-weight: 700; cursor: pointer;
          transition: border-color 0.2s ease, color 0.2s ease;
        }
        .stepper button:hover { border-color: var(--teal-dark); color: var(--teal-dark); }
        .stepper__value {
          min-width: 44px; text-align: center;
          font-family: var(--font-heading); font-size: 1.5rem; font-weight: 700;
        }
        /* Selectable chips: same recipe, selected = dark pill like the primary button. */
        .chips { display: flex; flex-wrap: wrap; gap: var(--space-2); }
        .chip {
          min-height: 44px; padding: var(--space-2) var(--space-6);
          border: 1px solid var(--paper-grid); border-radius: var(--radius-control);
          background: #ffffff; cursor: pointer; font-weight: 600; font-size: 0.95rem;
          transition: border-color 0.2s ease, color 0.2s ease;
        }
        .chip:hover { border-color: var(--teal-dark); color: var(--teal-dark); }
        .chip--on { background: var(--ink); border-color: var(--ink); color: #ffffff; }
        .chip--on:hover { color: #ffffff; }
        /* Consent: whole row is a bordered card and the tap target. */
        .consent {
          display: flex; gap: var(--space-3); align-items: flex-start;
          padding: 14px; border: 1px solid var(--paper-grid);
          border-radius: var(--radius-control); background: #ffffff;
          cursor: pointer; font-size: 0.92rem; line-height: 1.5;
        }
        .consent input { width: 18px; height: 18px; margin: 2px 0 0; flex: none; accent-color: var(--ink); }
        .form a { color: var(--teal-dark); font-size: 0.9rem; }
        .form-notice { max-width: 46ch; }
        .actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }
        .actions .button--primary { flex: 1; min-width: 200px; }
        @media (max-width: 640px) {
          .form { padding: var(--space-4); }
          .actions { flex-direction: column-reverse; }
          .actions .button { width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }

        /* Status banners */
        .form-status-banner {
          display: flex; align-items: flex-start; gap: var(--space-3);
          padding: var(--space-4); border-radius: var(--radius-control);
          margin-bottom: var(--space-2);
        }
        .form-status-banner--loading {
          background: var(--teal-light); color: var(--teal-dark);
          border: 1px solid var(--teal-dark);
        }
        .form-status-banner--closed {
          background: #fef2f2; color: #991b1b;
          border: 1px solid #fecaca;
        }
        .form-status-banner strong { display: block; font-size: 1rem; margin-bottom: 2px; }
        .form-status-banner p { margin: 0; font-size: 0.9rem; opacity: 0.9; }
        .spinner {
          width: 20px; height: 20px; flex: none; margin-top: 2px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </LazyMotion>
  );
}
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'motion/react';
import { content } from '../config/content';
import { eventConfig } from '../config/event';
import { validateRegistration } from '../lib/validate';
import { trackingForSubmit } from '../lib/utm';

interface RegistrationStatus {
  open: boolean;
  message: string | null;
  /** ISO UTC; null berarti tanpa countdown. */
  deadline: string | null;
  /** Admin membuka paksa setelah tenggat. */
  forced: boolean;
}

const EMPTY_STATUS: RegistrationStatus = {
  open: true,
  message: null,
  deadline: null,
  forced: false,
};

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Pecah sisa waktu menjadi hari/jam/menit/detik. */
function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3_600),
    minutes: Math.floor((total % 3_600) / 60),
    seconds: total % 60,
    urgent: total <= 3_600,
  };
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
  const [regStatus, setRegStatus] = useState<RegistrationStatus>(EMPTY_STATUS);
  const [regStatusLoading, setRegStatusLoading] = useState(true);
  // Selisih jam perangkat dengan server agar countdown tidak meleset.
  const clockOffset = useRef(0);
  const [nowTick, setNowTick] = useState(() => Date.now());
  // Floating countdown hanya tampil saat pengunjung melewati hero dan belum
  // sampai ke formulir (agar tidak menduplikasi banner di dalam form).
  const [floatingVisible, setFloatingVisible] = useState(false);

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
          const serverNow = Date.parse(data.now);
          if (Number.isFinite(serverNow)) clockOffset.current = serverNow - Date.now();
          setRegStatus({
            open: data.open ?? true,
            message: data.message ?? null,
            deadline: data.deadline ?? null,
            forced: data.forced ?? false,
          });
        }
      } catch {
        // Gagal fetch → default ke buka (fail-open untuk UX)
      } finally {
        setRegStatusLoading(false);
      }
    }
    fetchStatus();
  }, []);

  // Detak countdown. Memakai offset server agar batas waktu tetap konsisten
  // walau jam perangkat pengunjung tidak akurat.
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now() + clockOffset.current), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Tampilkan floating countdown di antara hero dan bagian formulir.
  useEffect(() => {
    const hero = document.getElementById('hero');
    const formSection = document.getElementById('form');
    const guideSection = document.getElementById('panduan');
    if (!formSection) return;

    let frame = 0;
    const sync = () => {
      frame = 0;
      const viewport = window.innerHeight;
      const heroRect = hero?.getBoundingClientRect();
      const formRect = formSection.getBoundingClientRect();
      const guideRect = guideSection?.getBoundingClientRect();
      const heroIn = heroRect ? heroRect.bottom > 0 && heroRect.top < viewport : false;
      const formIn = formRect.top < viewport && formRect.bottom > 0;
      const guideIn = guideRect ? guideRect.top < viewport && guideRect.bottom > 0 : false;
      // Sembunyikan saat panduan atau form terlihat agar tidak menutupi teks.
      setFloatingVisible(!heroIn && !formIn && !guideIn);
    };
    const requestSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(sync);
    };

    sync();
    window.addEventListener('scroll', requestSync, { passive: true });
    window.addEventListener('resize', requestSync);
    return () => {
      window.removeEventListener('scroll', requestSync);
      window.removeEventListener('resize', requestSync);
      if (frame) window.cancelAnimationFrame(frame);
    };
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

    // Cek ulang status sebelum submit (race condition guard, termasuk tenggat).
    if (!effectiveOpen) {
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

  const deadlineMs = regStatus.deadline ? Date.parse(regStatus.deadline) : null;
  const remainingMs =
    deadlineMs !== null && Number.isFinite(deadlineMs)
      ? Math.max(0, deadlineMs - nowTick)
      : null;
  // Tenggat lewat dan admin tidak memaksa buka => tutup otomatis di browser,
  // tanpa menunggu refresh. Server tetap memvalidasi hal yang sama.
  const autoExpired = remainingMs === 0 && !regStatus.forced;
  const effectiveOpen = regStatus.open && !autoExpired;
  const formDisabled = !effectiveOpen || regStatusLoading;
  const countdown = remainingMs !== null && remainingMs > 0 ? splitDuration(remainingMs) : null;

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
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray="31.4 31.4"
                strokeLinecap="round"
              />
            </svg>
            <span>Memuat status pendaftaran…</span>
          </m.div>
        )}

        {!regStatusLoading && effectiveOpen && countdown && remainingMs !== null && (
          <m.div
            className={`form-status-banner form-status-banner--countdown${
              countdown.urgent ? ' form-status-banner--urgent' : ''
            }`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
          >
            <div className="countdown">
              <div className="countdown__head">
                <strong>Pendaftaran ditutup dalam</strong>
              </div>
              <div
                className="countdown__digits"
                role="timer"
                aria-live="off"
                aria-label={`Sisa waktu ${countdown.days} hari ${countdown.hours} jam ${countdown.minutes} menit ${countdown.seconds} detik`}
              >
                {countdown.days > 0 && (
                  <span className="countdown__unit">
                    <span className="countdown__num">{countdown.days}</span>
                    <span className="countdown__label">hari</span>
                  </span>
                )}
                <span className="countdown__unit">
                  <span className="countdown__num">{pad2(countdown.hours)}</span>
                  <span className="countdown__label">jam</span>
                </span>
                <span className="countdown__colon" aria-hidden="true">
                  :
                </span>
                <span className="countdown__unit">
                  <span className="countdown__num">{pad2(countdown.minutes)}</span>
                  <span className="countdown__label">menit</span>
                </span>
                <span className="countdown__colon" aria-hidden="true">
                  :
                </span>
                <span className="countdown__unit">
                  <span className="countdown__num">{pad2(countdown.seconds)}</span>
                  <span className="countdown__label">detik</span>
                </span>
              </div>
            </div>
          </m.div>
        )}

        {!regStatusLoading && !effectiveOpen && (
          <m.div
            className="form-status-banner form-status-banner--closed"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role="alert"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>
              <strong>{autoExpired ? 'Tenggat Pendaftaran Berakhir' : 'Pendaftaran Ditutup'}</strong>
              <p>
                {regStatus.message ||
                  (autoExpired
                    ? 'Batas waktu konfirmasi kehadiran sudah lewat. Hubungi admisi bila masih ingin mendaftar.'
                    : content.errors.closed)}
              </p>
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
              <fieldset className="field field--attendee">
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

      {effectiveOpen && countdown && floatingVisible && (
        <a
          href="#form"
          className={`floating-countdown${
            countdown.urgent ? ' floating-countdown--urgent' : ''
          }`}
          aria-label={`Pendaftaran ditutup dalam ${countdown.days} hari ${countdown.hours} jam ${countdown.minutes} menit ${countdown.seconds} detik. Menuju formulir pendaftaran.`}
        >
          <span className="floating-countdown__label">Pendaftaran ditutup dalam</span>
          <span className="floating-countdown__time" role="timer" aria-live="off">
            {countdown.days > 0 && `${countdown.days}h `}
            {pad2(countdown.hours)}:{pad2(countdown.minutes)}:{pad2(countdown.seconds)}
          </span>
        </a>
      )}

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
        /* Jumlah hadir: beri napas ekstra terhadap label dan elemen berikutnya. */
        .field--attendee { margin-bottom: var(--space-4); padding-bottom: var(--space-2); }
        .field--attendee legend { margin-bottom: var(--space-2); }
        /* Tombol form: kotak membulat tipis, bukan pil, dan mengisi lebar. */
        .form .button { border-radius: 8px; }
        .form-next { margin-top: var(--space-4); width: 100%; }
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
        /* Stepper: kontrol - dan + serta angka berada di tengah dengan jarak lebar. */
        .stepper {
          display: flex; align-items: center; justify-content: center;
          gap: clamp(24px, 8vw, 56px); width: 100%;
        }
        .stepper button {
          width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center;
          border: 1px solid var(--paper-grid); border-radius: 8px;
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
          flex: 1 1 0; min-width: 96px; min-height: 44px; padding: var(--space-2);
          border: 1px solid var(--paper-grid); border-radius: 8px;
          background: #ffffff; cursor: pointer; font-weight: 600; font-size: 0.9rem;
          white-space: nowrap;
          transition: border-color 0.2s ease, color 0.2s ease;
        }
        .chip:hover { border-color: var(--teal-dark); color: var(--teal-dark); }
        .chip--on { background: var(--ink); border-color: var(--ink); color: #ffffff; }
        .chip--on:hover { color: #ffffff; }
        /* Consent: whole row is a bordered card and the tap target. */
        .consent {
          display: flex; gap: var(--space-3); align-items: flex-start;
          padding: 14px; border: 1px solid var(--paper-grid);
          border-radius: 8px; background: #ffffff;
          cursor: pointer; font-size: 0.84rem; line-height: 1.45;
        }
        .consent input { width: 18px; height: 18px; margin: 2px 0 0; flex: none; accent-color: var(--ink); }
        .form a { color: var(--teal-dark); font-size: 0.78rem; }
        .form-notice { max-width: 46ch; }
        /* Dua tombol mengisi satu baris penuh; tidak ada ruang kosong. */
        .actions { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr); gap: var(--space-3); }
        .actions .button { width: 100%; }
        @media (max-width: 640px) {
          .form { padding: var(--space-4); }
          .actions { grid-template-columns: 1fr; }
          .actions .button--primary { order: -1; }
        }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }

        /* Status banners */
        .form-status-banner {
          display: flex; align-items: flex-start; gap: var(--space-3);
          padding: var(--space-4); border-radius: 8px;
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
        /* Countdown: hangat saat normal, memerah saat sisa waktu < 1 jam. */
        .form-status-banner--countdown {
          background: #fff7ed; color: #7c2d12;
          border: 1px solid #fed7aa;
        }
        .form-status-banner--urgent {
          background: #fef2f2; color: #991b1b;
          border-color: #fecaca;
        }
        .countdown { width: 100%; }
        .countdown__head {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.82rem; font-weight: 700;
          letter-spacing: 0.08em; text-transform: uppercase;
        }
        .countdown__digits {
          display: flex; align-items: flex-start; justify-content: space-between;
          width: 100%; gap: clamp(4px, 2vw, 16px);
          margin-top: 8px;
          font-family: var(--font-heading); font-variant-numeric: tabular-nums;
        }
        .countdown__unit { flex: 1; display: flex; flex-direction: column; align-items: center; }
        .countdown__colon { align-self: center; }
        .countdown__num { font-size: clamp(1.6rem, 5vw, 2.1rem); font-weight: 700; line-height: 1; }
        .countdown__label {
          margin-top: 4px; font-size: 0.62rem; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.75;
        }
        .countdown__colon { font-size: 1.4rem; font-weight: 700; line-height: 1.4; opacity: 0.5; }
        .countdown__head strong { display: inline; font-size: inherit; margin: 0; }
        /* Floating countdown: muncul di antara hero dan form. */
        .floating-countdown {
          position: fixed; z-index: 30;
          right: var(--space-6); bottom: var(--space-6);
          display: flex; align-items: center; gap: 12px;
          padding: 10px 16px;
          border: 1px solid #fed7aa; border-radius: 14px;
          background: #fff7ed; color: #7c2d12;
          text-decoration: none;
          transition: background 0.2s ease, border-color 0.2s ease;
        }
        .floating-countdown:hover { background: #ffedd5; border-color: #fdba74; }
        .floating-countdown:focus-visible { outline: 2px solid var(--teal-dark); outline-offset: 2px; }
        .floating-countdown--urgent { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
        .floating-countdown--urgent:hover { background: #fee2e2; border-color: #fca5a5; }
        .floating-countdown__label {
          max-width: 11ch;
          font-family: var(--font-heading); font-size: 0.66rem; font-weight: 700;
          letter-spacing: 0.07em; line-height: 1.2; text-transform: uppercase;
        }
        .floating-countdown__time {
          font-family: var(--font-heading); font-size: 1.2rem; font-weight: 700;
          font-variant-numeric: tabular-nums; letter-spacing: 0.02em; white-space: nowrap;
        }
        @media (max-width: 719px) {
          .floating-countdown {
            left: var(--space-4); right: var(--space-4);
            bottom: calc(var(--space-4) + 58px + env(safe-area-inset-bottom, 0px));
            justify-content: space-between;
            padding: 9px 14px; border-radius: 12px;
          }
          .floating-countdown__label { max-width: none; font-size: 0.62rem; }
          .floating-countdown__time { font-size: 1.05rem; }
        }
        @media (prefers-reduced-motion: reduce) { .floating-countdown { transition: none; } }
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

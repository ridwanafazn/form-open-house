import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { buildCsv, downloadCsv } from '../lib/csv';
import type { CsvRow } from '../lib/csv';
import { content } from '../config/content';

// ---------------------------------------------------------------------------
// Supabase client — memakai anon key, keamanan bergantung pada RLS
// ---------------------------------------------------------------------------
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// ---------------------------------------------------------------------------
// Tipe
// ---------------------------------------------------------------------------
type FollowupStatus =
  | 'belum_dihubungi'
  | 'sudah_dihubungi'
  | 'merespons'
  | 'tertarik'
  | 'tidak_jadi'
  | 'sudah_daftar_pmb';

interface Registration {
  id: string;
  created_at: string;
  child_name: string;
  parent_phone: string;
  parent_name: string | null;
  attendee_count: number;
  city: string;
  school: string;
  interest_major: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  fbclid: string | null;
  referrer: string | null;
  device: string | null;
  followup_status: FollowupStatus;
  assigned_to: string | null;
  followup_note: string | null;
}

type Screen = 'login' | 'checking' | 'list' | 'detail';

const STATUS_LABELS: Record<FollowupStatus, string> = {
  belum_dihubungi: 'Belum dihubungi',
  sudah_dihubungi: 'Sudah dihubungi',
  merespons: 'Merespons',
  tertarik: 'Tertarik',
  tidak_jadi: 'Tidak jadi',
  sudah_daftar_pmb: 'Sudah daftar PMB',
};

// ---------------------------------------------------------------------------
// Komponen utama
// ---------------------------------------------------------------------------
export default function AdminApp() {
  const [screen, setScreen] = useState<Screen>('login');
  const [loginError, setLoginError] = useState('');
  const [configError, setConfigError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setConfigError('Konfigurasi Supabase belum lengkap. Periksa variabel PUBLIC_SUPABASE_URL dan PUBLIC_SUPABASE_ANON_KEY.');
    }
  }, []);

  // Cek sesi yang sudah ada
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setScreen('checking');
      }
    });
  }, []);

  async function handleLogin(email: string, password: string) {
    if (!supabase) return;
    setLoginError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError('Email atau kata sandi tidak cocok.');
      return;
    }
    setScreen('checking');
  }

  async function handleAdminCheck() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setScreen('login'); return; }

    const { data, error } = await supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) {
      await supabase.auth.signOut();
      setLoginError('Akun ini tidak punya akses ke halaman admin.');
      setScreen('login');
      return;
    }
    setScreen('list');
  }

  useEffect(() => {
    if (screen === 'checking') handleAdminCheck();
  }, [screen]);

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setScreen('login');
    setLoginError('');
  }

  if (configError) return <ErrorScreen message={configError} />;

  if (screen === 'login') return <LoginScreen onLogin={handleLogin} error={loginError} />;
  if (screen === 'checking') return <LoadingScreen message="Memeriksa akses…" />;
  if (screen === 'list') return (
    <ListScreen
      onLogout={handleLogout}
      setScreen={setScreen}
    />
  );

  return null;
}

// ---------------------------------------------------------------------------
// Komponen helper kecil
// ---------------------------------------------------------------------------
function LoadingScreen({ message }: { message: string }) {
  return <div className="admin-center"><p>{message}</p></div>;
}

function ErrorScreen({ message }: { message: string }) {
  return <div className="admin-center admin-error"><p>{message}</p></div>;
}

// ---------------------------------------------------------------------------
// Layar login
// ---------------------------------------------------------------------------
function LoginScreen({ onLogin, error }: { onLogin: (e: string, p: string) => void; error: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await onLogin(email, password);
    setSubmitting(false);
  }

  return (
    <div className="admin-center">
      <form className="admin-login" onSubmit={handleSubmit}>
        <h1>Admin Open House</h1>
        {error && <p className="admin-login__error" role="alert">{error}</p>}
        <label>
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label>
          <span>Kata sandi</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Masuk…' : 'Masuk'}
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layar daftar
// ---------------------------------------------------------------------------
function ListScreen({
  onLogout,
  setScreen,
}: {
  onLogout: () => void;
  setScreen: (s: Screen) => void;
}) {
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssigned, setFilterAssigned] = useState('');
  const [selected, setSelected] = useState<Registration | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { setLoadError('Gagal memuat data.'); }
        else { setRows((data as Registration[]) ?? []); }
        setLoading(false);
      });
  }, []);

  const assignees = Array.from(new Set(rows.map((r) => r.assigned_to).filter(Boolean))) as string[];

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.child_name.toLowerCase().includes(q) ||
      r.parent_phone.includes(q);
    const matchStatus = !filterStatus || r.followup_status === filterStatus;
    const matchAssigned = !filterAssigned || r.assigned_to === filterAssigned;
    return matchSearch && matchStatus && matchAssigned;
  });

  const totalHadir = filtered.reduce((s, r) => s + r.attendee_count, 0);

  const sourceSummary = rows.reduce<Record<string, number>>((acc, r) => {
    const src = r.utm_source ?? 'langsung';
    acc[src] = (acc[src] ?? 0) + 1;
    return acc;
  }, {});

  function handleExport() {
    const csvRows: CsvRow[] = filtered.map((r) => ({
      created_at: r.created_at,
      child_name: r.child_name,
      parent_phone: r.parent_phone,
      parent_name: r.parent_name,
      attendee_count: r.attendee_count,
      city: r.city,
      school: r.school,
      interest_major: r.interest_major,
      utm_source: r.utm_source,
      utm_campaign: r.utm_campaign,
      followup_status: r.followup_status,
      assigned_to: r.assigned_to,
      followup_note: r.followup_note,
    }));
    downloadCsv('pendaftar-openhouse.csv', buildCsv(csvRows));
  }

  function handleSelect(r: Registration) {
    setSelected(r);
  }

  function handleBack() {
    setSelected(null);
    // Refresh data setelah kembali dari detail
    if (!supabase) return;
    supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setRows(data as Registration[]);
      });
  }

  if (selected) {
    return <DetailScreen registration={selected} onBack={handleBack} />;
  }

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <h1>Admin Open House</h1>
        <button className="admin-btn admin-btn--ghost" onClick={onLogout}>Keluar</button>
      </header>

      {/* Ringkasan */}
      <section className="admin-summary">
        <div className="admin-stat">
          <span className="admin-stat__num">{rows.length}</span>
          <span className="admin-stat__label">Total pendaftar</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__num">{rows.reduce((s, r) => s + r.attendee_count, 0)}</span>
          <span className="admin-stat__label">Total akan hadir</span>
        </div>
        <div className="admin-stat admin-stat--sources">
          <span className="admin-stat__label">Per sumber</span>
          <ul className="admin-source-list">
            {Object.entries(sourceSummary).sort((a, b) => b[1] - a[1]).map(([src, count]) => (
              <li key={src}><strong>{src}</strong> {count}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Filter dan aksi */}
      <div className="admin-toolbar">
        <input
          className="admin-search"
          type="search"
          placeholder="Cari nama anak atau nomor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="admin-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">Semua status</option>
          {(Object.keys(STATUS_LABELS) as FollowupStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        {assignees.length > 0 && (
          <select
            className="admin-select"
            value={filterAssigned}
            onChange={(e) => setFilterAssigned(e.target.value)}
          >
            <option value="">Semua PJ</option>
            {assignees.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
        <button className="admin-btn" onClick={handleExport}>
          Ekspor CSV ({filtered.length})
        </button>
      </div>

      {loading && <p className="admin-msg">Memuat…</p>}
      {loadError && <p className="admin-msg admin-msg--error">{loadError}</p>}

      {!loading && !loadError && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Nama anak</th>
                <th>Kota</th>
                <th>Sekolah</th>
                <th>Hadir</th>
                <th>Status</th>
                <th>PJ</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="admin-table__empty">Tidak ada data.</td></tr>
              )}
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="admin-table__row"
                  onClick={() => handleSelect(r)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelect(r)}
                >
                  <td>{new Date(r.created_at).toLocaleDateString('id-ID')}</td>
                  <td>{r.child_name}</td>
                  <td>{r.city}</td>
                  <td>{r.school}</td>
                  <td>{r.attendee_count}</td>
                  <td>{STATUS_LABELS[r.followup_status] ?? r.followup_status}</td>
                  <td>{r.assigned_to ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Layar detail
// ---------------------------------------------------------------------------
function DetailScreen({
  registration: initial,
  onBack,
}: {
  registration: Registration;
  onBack: () => void;
}) {
  const [reg, setReg] = useState(initial);
  const [status, setStatus] = useState<FollowupStatus>(initial.followup_status);
  const [assignedTo, setAssignedTo] = useState(initial.assigned_to ?? '');
  const [note, setNote] = useState(initial.followup_note ?? '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  async function handleSave() {
    if (!supabase) return;
    setSaving(true);
    setSaveMsg('');
    const { error } = await supabase
      .from('registrations')
      .update({
        followup_status: status,
        assigned_to: assignedTo || null,
        followup_note: note || null,
      })
      .eq('id', reg.id);
    setSaving(false);
    setSaveMsg(error ? 'Gagal menyimpan.' : 'Tersimpan.');
  }

  function buildWaMessage() {
    const sapaan = reg.parent_name
      ? `Bapak atau Ibu ${reg.parent_name}`
      : `Bapak atau Ibu dari ${reg.child_name}`;
    return content.waMessage.greeting
      .replace('{sapaan}', sapaan)
      .replace('{nama anak}', reg.child_name);
  }

  function handleChatWa() {
    const nomor = reg.parent_phone.replace('+', '');
    const pesan = encodeURIComponent(buildWaMessage());
    window.open(`https://wa.me/${nomor}?text=${pesan}`, '_blank', 'noopener');
  }

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <button className="admin-btn admin-btn--ghost" onClick={onBack}>← Kembali</button>
        <h1>Detail pendaftar</h1>
      </header>

      <div className="admin-detail">
        <dl className="admin-dl">
          <dt>Nama anak</dt><dd>{reg.child_name}</dd>
          <dt>Nomor HP</dt><dd>{reg.parent_phone}</dd>
          <dt>Nama orang tua</dt><dd>{reg.parent_name ?? '—'}</dd>
          <dt>Jumlah hadir</dt><dd>{reg.attendee_count}</dd>
          <dt>Kota</dt><dd>{reg.city}</dd>
          <dt>Sekolah</dt><dd>{reg.school}</dd>
          <dt>Minat jurusan</dt><dd>{reg.interest_major ?? '—'}</dd>
          <dt>Sumber</dt><dd>{reg.utm_source ?? '—'}</dd>
          <dt>Kampanye</dt><dd>{reg.utm_campaign ?? '—'}</dd>
          <dt>Perangkat</dt><dd>{reg.device ?? '—'}</dd>
          <dt>Waktu daftar</dt><dd>{new Date(reg.created_at).toLocaleString('id-ID')}</dd>
        </dl>

        <div className="admin-edit">
          <label>
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as FollowupStatus)}>
              {(Object.keys(STATUS_LABELS) as FollowupStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Penanggung jawab</span>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              maxLength={100}
            />
          </label>
          <label>
            <span>Catatan</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              rows={4}
            />
          </label>
          <div className="admin-edit__actions">
            <button className="admin-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan…' : 'Simpan'}
            </button>
            <button className="admin-btn admin-btn--wa" onClick={handleChatWa}>
              Chat WhatsApp
            </button>
          </div>
          {saveMsg && <p className="admin-msg">{saveMsg}</p>}
        </div>
      </div>

      <style>{adminStyles}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Style admin (scoped ke komponen ini agar tidak bocor)
// ---------------------------------------------------------------------------
const adminStyles = `
  .admin-center {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 16px;
  }
  .admin-login {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    max-width: 360px;
  }
  .admin-login h1 {
    font-size: 1.4rem;
    margin: 0 0 8px;
  }
  .admin-login label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.9rem;
  }
  .admin-login input {
    border: 2px solid #22262a;
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 1rem;
    background: #f4efe4;
  }
  .admin-login button {
    padding: 10px;
    border: 2px solid #22262a;
    border-radius: 6px;
    background: #1b9a94;
    color: #f4efe4;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
  }
  .admin-login button:disabled { opacity: 0.6; cursor: not-allowed; }
  .admin-login__error {
    color: #a32020;
    font-size: 0.9rem;
    margin: 0;
    padding: 8px;
    border: 1px solid #a32020;
    border-radius: 6px;
  }
  .admin-wrap {
    max-width: 1120px;
    margin-inline: auto;
    padding: 16px;
  }
  .admin-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }
  .admin-header h1 {
    font-size: 1.4rem;
    margin: 0;
    flex: 1;
  }
  .admin-summary {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 24px;
    padding: 16px;
    border: 2px solid #e3dccb;
    border-radius: 6px;
    background: #f9f6ef;
  }
  .admin-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 100px;
  }
  .admin-stat__num {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
    color: #1b9a94;
  }
  .admin-stat__label { font-size: 0.8rem; color: #5b6068; }
  .admin-stat--sources { flex: 1; }
  .admin-source-list {
    list-style: none;
    padding: 0;
    margin: 4px 0 0;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    font-size: 0.85rem;
  }
  .admin-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }
  .admin-search {
    flex: 1;
    min-width: 180px;
    padding: 8px 10px;
    border: 2px solid #22262a;
    border-radius: 6px;
    font-size: 0.9rem;
    background: #f4efe4;
  }
  .admin-select {
    padding: 8px 10px;
    border: 2px solid #22262a;
    border-radius: 6px;
    font-size: 0.9rem;
    background: #f4efe4;
    cursor: pointer;
  }
  .admin-btn {
    padding: 8px 16px;
    border: 2px solid #22262a;
    border-radius: 6px;
    background: #22262a;
    color: #f4efe4;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
  .admin-btn--ghost {
    background: transparent;
    color: #22262a;
  }
  .admin-btn--wa {
    background: #1a7a3b;
    border-color: #1a7a3b;
  }
  .admin-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .admin-table-wrap { overflow-x: auto; }
  .admin-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }
  .admin-table th {
    text-align: left;
    padding: 8px 10px;
    border-bottom: 2px solid #22262a;
    white-space: nowrap;
    font-weight: 700;
  }
  .admin-table td {
    padding: 8px 10px;
    border-bottom: 1px solid #e3dccb;
    vertical-align: top;
  }
  .admin-table__row { cursor: pointer; }
  .admin-table__row:hover td { background: #f0ebe0; }
  .admin-table__row:focus td { outline: 2px solid #1b9a94; }
  .admin-table__empty {
    text-align: center;
    color: #5b6068;
    padding: 32px;
  }
  .admin-msg { font-size: 0.9rem; margin: 8px 0 0; }
  .admin-msg--error { color: #a32020; }
  .admin-error p { color: #a32020; }
  .admin-detail {
    display: grid;
    gap: 24px;
  }
  @media (min-width: 720px) {
    .admin-detail { grid-template-columns: 1fr 1fr; }
  }
  .admin-dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 16px;
    font-size: 0.9rem;
    margin: 0;
  }
  .admin-dl dt { color: #5b6068; white-space: nowrap; }
  .admin-dl dd { margin: 0; word-break: break-word; }
  .admin-edit {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .admin-edit label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.9rem;
  }
  .admin-edit input,
  .admin-edit select,
  .admin-edit textarea {
    border: 2px solid #22262a;
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 0.9rem;
    background: #f4efe4;
    resize: vertical;
  }
  .admin-edit__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
`;

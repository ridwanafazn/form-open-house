import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Html5Qrcode } from 'html5-qrcode';
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
  ticket_code: string | null;
  attended_at: string | null;
}

type Screen = 'login' | 'checking' | 'list' | 'detail';
type Tab = 'list' | 'scan';

const STATUS_LABELS: Record<FollowupStatus, string> = {
  belum_dihubungi: 'Belum dihubungi',
  sudah_dihubungi: 'Sudah dihubungi',
  merespons: 'Merespons',
  tertarik: 'Tertarik',
  tidak_jadi: 'Tidak jadi',
  sudah_daftar_pmb: 'Sudah daftar PMB',
};

function showAdminProfile(user: {
  id: string;
  email?: string | null;
  user_metadata?: { full_name?: string; name?: string };
}) {
  const wrap = document.getElementById('admin-nav-user');
  const name = document.getElementById('admin-nav-name');
  const avatar = document.getElementById('admin-nav-avatar');
  if (!wrap || !name || !avatar) return;
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'Admin';
  name.textContent = displayName;
  // Foto profil acak dari dicebear sesuai seed akun.
  avatar.src = `https://api.dicebear.com/9.x/dice/svg?seed=${encodeURIComponent(user.id || displayName)}`;
  wrap.hidden = false;
  try {
    localStorage.setItem('oh_admin_email', user.email ?? '');
  } catch {
    /* storage tidak tersedia; abaikan */
  }
}

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
        showAdminProfile(data.session.user);
        setScreen('checking');
      }
    });
  }, []);

  // Tombol keluar kini berada di navbar, bukan di halaman.
  useEffect(() => {
    const onNavLogout = () => {
      if (supabase) void supabase.auth.signOut();
      const wrap = document.getElementById('admin-nav-user');
      if (wrap) wrap.hidden = true;
      try {
        localStorage.removeItem('oh_admin_email');
      } catch {
        /* storage tidak tersedia; abaikan */
      }
      setScreen('login');
      setLoginError('');
    };
    window.addEventListener('admin-logout', onNavLogout);
    return () => window.removeEventListener('admin-logout', onNavLogout);
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
    showAdminProfile(user);
    setScreen('list');
  }

  useEffect(() => {
    if (screen === 'checking') handleAdminCheck();
  }, [screen]);

  if (configError) return <ErrorScreen message={configError} />;

  if (screen === 'login') return <LoginScreen onLogin={handleLogin} error={loginError} />;
  if (screen === 'checking') return <LoadingScreen message="Memeriksa akses…" />;
  if (screen === 'list') return (
    <ListScreen setScreen={setScreen} />
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
    <>
      <style>{adminStyles}</style>
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
    </>
  );
}

// ---------------------------------------------------------------------------
// Layar daftar
// ---------------------------------------------------------------------------
function ListScreen({
  setScreen,
}: {
  setScreen: (s: Screen) => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>(() =>
    typeof window !== 'undefined' && window.location.hash === '#scan' ? 'scan' : 'list',
  );
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAttendance, setFilterAttendance] = useState<'all' | 'attended' | 'absent'>('all');
  const [filterAssigned, setFilterAssigned] = useState('');
  const [selected, setSelected] = useState<Registration | null>(null);

  function fetchRegistrations() {
    if (!supabase) return;
    setLoading(true);
    supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setLoadError('Gagal memuat data.');
        } else {
          setRows((data as Registration[]) ?? []);
        }
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchRegistrations();
  }, []);

  useEffect(() => {
    const syncHash = () => {
      setActiveTab(window.location.hash === '#scan' ? 'scan' : 'list');
    };
    window.addEventListener('hashchange', syncHash);
    syncHash();
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  const assignees = Array.from(new Set(rows.map((r) => r.assigned_to).filter(Boolean))) as string[];

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      r.child_name.toLowerCase().includes(q) ||
      r.parent_phone.includes(q) ||
      (r.ticket_code && r.ticket_code.toLowerCase().includes(q));
    const matchStatus = !filterStatus || r.followup_status === filterStatus;
    const matchAssigned = !filterAssigned || r.assigned_to === filterAssigned;
    const matchAttendance =
      filterAttendance === 'all'
        ? true
        : filterAttendance === 'attended'
          ? !!r.attended_at
          : !r.attended_at;

    return matchSearch && matchStatus && matchAssigned && matchAttendance;
  });

  const totalRegistered = rows.length;
  const attendedRows = rows.filter((r) => !!r.attended_at);
  const totalAttended = attendedRows.length;
  const totalAbsent = totalRegistered - totalAttended;
  const totalAttendedPersons = attendedRows.reduce((sum, r) => sum + r.attendee_count, 0);
  const totalExpectedPersons = rows.reduce((sum, r) => sum + r.attendee_count, 0);

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
    fetchRegistrations();
  }

  function handleCheckInSuccess(updatedId: string, attendedAt: string) {
    setRows((prev) =>
      prev.map((item) => (item.id === updatedId ? { ...item, attended_at: attendedAt } : item)),
    );
  }

  if (selected) {
    return (
      <DetailScreen
        registration={selected}
        onBack={handleBack}
        onUpdateRow={(updated) => {
          setSelected(updated);
          setRows((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        }}
      />
    );
  }

  return (
    <>
      <style>{adminStyles}</style>
      <div className="admin-wrap" id="dashboard">
      <header className="admin-header">
        <div className="admin-header__brand">
          <div className="admin-header__title">
            <p className="admin-kicker">Ruang kerja panitia</p>
            <h1>Admin Open House</h1>
            <p className="admin-header__hint">Pantau pendaftar, tindak lanjuti keluarga, dan catat kehadiran dari satu tempat.</p>
          </div>
          <div className="admin-tabs">
            <button
              type="button"
              className={`admin-tab ${activeTab === 'list' ? 'admin-tab--active' : ''}`}
              onClick={() => {
                setActiveTab('list');
                window.history.replaceState(null, '', '#dashboard');
              }}
            >
              Daftar peserta: {rows.length}
            </button>
            <button
              type="button"
              className={`admin-tab admin-tab--scan ${activeTab === 'scan' ? 'admin-tab--active' : ''}`}
              onClick={() => {
                setActiveTab('scan');
                window.history.replaceState(null, '', '#scan');
              }}
            >
              Scan Presensi QR
            </button>
          </div>
        </div>
      </header>

      {/* Tampilan Tab Scan Presensi */}
      {activeTab === 'scan' ? (
        <ScannerTab
          rows={rows}
          onCheckInSuccess={handleCheckInSuccess}
          onSelectRegistration={handleSelect}
        />
      ) : (
        <>
          {/* Ringkasan Statistik Presensi & Pendaftaran */}
          <section className="admin-summary">
            <div className="admin-stat">
              <span className="admin-stat__num">{totalRegistered}</span>
              <span className="admin-stat__label">Total Pendaftar</span>
            </div>
            <div className="admin-stat admin-stat--attended">
              <span className="admin-stat__num">{totalAttended}</span>
              <span className="admin-stat__label">Hadir: {totalAttendedPersons} orang</span>
            </div>
            <div className="admin-stat admin-stat--absent">
              <span className="admin-stat__num">{totalAbsent}</span>
              <span className="admin-stat__label">Belum Hadir</span>
            </div>
            <div className="admin-stat">
              <span className="admin-stat__num">{totalExpectedPersons}</span>
              <span className="admin-stat__label">Target Total Hadir</span>
            </div>
            <div className="admin-stat admin-stat--sources">
              <span className="admin-stat__label">Sumber pendaftaran</span>
              <ul className="admin-source-list">
                {Object.entries(sourceSummary)
                  .sort((a, b) => b[1] - a[1])
                  .map(([src, count]) => (
                    <li key={src}>
                      <strong>{src}</strong> {count}
                    </li>
                  ))}
              </ul>
            </div>
          </section>

          {/* Filter dan aksi */}
          <div className="admin-toolbar">
            <input
              className="admin-search"
              type="search"
              placeholder="Cari nama, tiket (OH-...), nomor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="admin-select"
              value={filterAttendance}
              onChange={(e) => setFilterAttendance(e.target.value as 'all' | 'attended' | 'absent')}
            >
              <option value="all">Semua Presensi</option>
              <option value="attended">Sudah hadir: {totalAttended}</option>
              <option value="absent">Belum hadir: {totalAbsent}</option>
            </select>
            <select
              className="admin-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Semua Status Tindak Lanjut</option>
              {(Object.keys(STATUS_LABELS) as FollowupStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            {assignees.length > 0 && (
              <select
                className="admin-select"
                value={filterAssigned}
                onChange={(e) => setFilterAssigned(e.target.value)}
              >
                <option value="">Semua PJ</option>
                {assignees.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            )}
            <button className="admin-btn" onClick={handleExport}>
              Ekspor CSV ({filtered.length})
            </button>
          </div>

          {loading && <p className="admin-msg">Memuat data pendaftar…</p>}
          {loadError && <p className="admin-msg admin-msg--error">{loadError}</p>}

          {!loading && !loadError && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Presensi</th>
                    <th>Kode Tiket</th>
                    <th>Nama Anak</th>
                    <th>Asal Kota</th>
                    <th>Asal Sekolah</th>
                    <th>Hadir</th>
                    <th>Status Tindak Lanjut</th>
                    <th>PJ</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="admin-table__empty">
                        Tidak ada data yang sesuai filter.
                      </td>
                    </tr>
                  )}
                  {filtered.map((r) => (
                    <tr
                      key={r.id}
                      className="admin-table__row"
                      onClick={() => handleSelect(r)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleSelect(r)}
                    >
                      <td>
                        {r.attended_at ? (
                          <span className="badge badge--attended" title={`Hadir: ${new Date(r.attended_at).toLocaleString('id-ID')}`}>
                            Hadir: {new Date(r.attended_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span className="badge badge--absent">Belum Hadir</span>
                        )}
                      </td>
                      <td>
                        <code className="admin-code">{r.ticket_code || '—'}</code>
                      </td>
                      <td>
                        <strong>{r.child_name}</strong>
                      </td>
                      <td>{r.city}</td>
                      <td>{r.school}</td>
                      <td>{r.attendee_count} Orang</td>
                      <td>{STATUS_LABELS[r.followup_status] ?? r.followup_status}</td>
                      <td>{r.assigned_to ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Layar detail
// ---------------------------------------------------------------------------
function DetailScreen({
  registration: initial,
  onBack,
  onUpdateRow,
}: {
  registration: Registration;
  onBack: () => void;
  onUpdateRow: (r: Registration) => void;
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
    if (!error) {
      const updated = {
        ...reg,
        followup_status: status,
        assigned_to: assignedTo || null,
        followup_note: note || null,
      };
      setReg(updated);
      onUpdateRow(updated);
      setSaveMsg('Perubahan tersimpan.');
    } else {
      setSaveMsg('Gagal menyimpan.');
    }
  }

  async function toggleAttendance() {
    if (!supabase) return;
    setSaving(true);
    setSaveMsg('');
    const nextAttended = reg.attended_at ? null : new Date().toISOString();
    const { error } = await supabase
      .from('registrations')
      .update({ attended_at: nextAttended })
      .eq('id', reg.id);
    setSaving(false);
    if (!error) {
      const updated = { ...reg, attended_at: nextAttended };
      setReg(updated);
      onUpdateRow(updated);
      setSaveMsg(nextAttended ? 'Presensi berhasil dicatat (Hadir).' : 'Presensi dibatalkan (Belum Hadir).');
    } else {
      setSaveMsg('Gagal memperbarui status kehadiran.');
    }
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
        <h1>Detail Pendaftar</h1>
      </header>

      <div className="admin-detail">
        <dl className="admin-dl">
          <dt>Status Presensi</dt>
          <dd>
            {reg.attended_at ? (
              <span className="badge badge--attended">
                Hadir: {new Date(reg.attended_at).toLocaleString('id-ID')}
              </span>
            ) : (
              <span className="badge badge--absent">Belum Hadir</span>
            )}
          </dd>
          <dt>Kode Tiket</dt><dd><strong>{reg.ticket_code || '—'}</strong></dd>
          <dt>Nama anak</dt><dd>{reg.child_name}</dd>
          <dt>Nomor HP</dt><dd>{reg.parent_phone}</dd>
          <dt>Nama orang tua</dt><dd>{reg.parent_name ?? '—'}</dd>
          <dt>Jumlah hadir</dt><dd>{reg.attendee_count} Orang</dd>
          <dt>Kota</dt><dd>{reg.city}</dd>
          <dt>Sekolah</dt><dd>{reg.school}</dd>
          <dt>Minat jurusan</dt><dd>{reg.interest_major ?? '—'}</dd>
          <dt>Sumber</dt><dd>{reg.utm_source ?? '—'}</dd>
          <dt>Kampanye</dt><dd>{reg.utm_campaign ?? '—'}</dd>
          <dt>Perangkat</dt><dd>{reg.device ?? '—'}</dd>
          <dt>Waktu daftar</dt><dd>{new Date(reg.created_at).toLocaleString('id-ID')}</dd>
        </dl>

        <div className="admin-edit">
          <div className="admin-edit__section">
            <span className="admin-edit__title">Aksi Presensi Acara:</span>
            <button
              type="button"
              className={`admin-btn ${reg.attended_at ? 'admin-btn--ghost' : 'admin-btn--attended'}`}
              onClick={toggleAttendance}
              disabled={saving}
            >
              {reg.attended_at ? 'Batalkan Presensi Hadir' : 'Tandai Hadir Sekarang'}
            </button>
          </div>

          <label>
            <span>Status Tindak Lanjut</span>
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
// Komponen Tab Pemindai Presensi (Scanner)
// ---------------------------------------------------------------------------
function ScannerTab({
  rows,
  onCheckInSuccess,
  onSelectRegistration,
}: {
  rows: Registration[];
  onCheckInSuccess: (id: string, attendedAt: string) => void;
  onSelectRegistration: (r: Registration) => void;
}) {
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<{
    type: 'success' | 'duplicate' | 'error';
    message: string;
    item?: Registration;
  } | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'admin-qr-reader';

  async function handleProcessCode(rawCode: string) {
    if (processing) return;
    const code = rawCode.trim();
    if (!code) return;

    setProcessing(true);

    // Ambil string kode jika di-format sebagai query string URL
    let cleanCode = code;
    try {
      if (code.startsWith('http://') || code.startsWith('https://')) {
        const u = new URL(code);
        cleanCode = u.searchParams.get('scan') || u.searchParams.get('code') || code;
      }
    } catch {
      /* abaikan parsing URL */
    }

    // 1. Cari di local rows
    let target = rows.find(
      (r) =>
        (r.ticket_code && r.ticket_code.toLowerCase() === cleanCode.toLowerCase()) ||
        r.id === cleanCode ||
        r.parent_phone.includes(cleanCode),
    );

    // 2. Jika tidak ada di local, cari via Supabase
    if (!target && supabase) {
      const { data } = await supabase
        .from('registrations')
        .select('*')
        .or(`ticket_code.eq.${cleanCode},id.eq.${cleanCode}`)
        .maybeSingle();
      if (data) target = data as Registration;
    }

    if (!target) {
      setScanResult({
        type: 'error',
        message: `Tiket "${cleanCode}" tidak ditemukan dalam sistem pendaftaran.`,
      });
      setProcessing(false);
      return;
    }

    // 3. Jika sudah hadir
    if (target.attended_at) {
      const jam = new Date(target.attended_at).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setScanResult({
        type: 'duplicate',
        message: `${target.child_name} dari ${target.school} sudah tercatat hadir pada pukul ${jam} WIB.`,
        item: target,
      });
      setProcessing(false);
      return;
    }

    // 4. Catat kehadiran baru
    const now = new Date().toISOString();
    if (supabase) {
      await supabase.from('registrations').update({ attended_at: now }).eq('id', target.id);
    }
    const updated = { ...target, attended_at: now };
    onCheckInSuccess(target.id, now);
    setScanResult({
      type: 'success',
      message: `Presensi berhasil. ${target.child_name} dari ${target.school} hadir bersama ${target.attendee_count} orang.`,
      item: updated,
    });
    setManualCode('');
    setProcessing(false);
  }

  async function startCamera() {
    setCameraError('');
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(readerElementId);
      }
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleProcessCode(decodedText);
        },
        () => {
          // ignore scan frame misses
        },
      );
      setIsScanning(true);
    } catch (err) {
      console.error('Kamera gagal dibuka:', err);
      setCameraError('Kamera tidak dapat diakses. Pastikan izin kamera telah disetujui di browser.');
      setIsScanning(false);
    }
  }

  async function stopCamera() {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error('Kamera stop error:', err);
      }
      setIsScanning(false);
    }
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const recentlyAttended = rows
    .filter((r) => !!r.attended_at)
    .sort((a, b) => (b.attended_at! > a.attended_at! ? 1 : -1))
    .slice(0, 5);

  return (
    <section className="admin-scanner-tab" id="scan">
      <div className="admin-scanner-grid">
        {/* Kolom Kamera & Input */}
        <div className="admin-scanner-card">
          <h2>Pemindai QR Code Tiket</h2>
          <p className="admin-scanner-desc">
            Arahkan kamera ke QR Code di layar HP peserta atau ketik kode tiket pendaftaran.
          </p>

          <div className="admin-scanner-controls">
            {!isScanning ? (
              <button type="button" className="admin-btn admin-btn--attended" onClick={startCamera}>
                Buka Kamera Scanner
              </button>
            ) : (
              <button type="button" className="admin-btn admin-btn--ghost" onClick={stopCamera}>
                Tutup Kamera
              </button>
            )}
          </div>

          {cameraError && <p className="admin-msg admin-msg--error">{cameraError}</p>}

          <div
            id={readerElementId}
            className={`admin-reader-box ${isScanning ? 'admin-reader-box--active' : ''}`}
          />

          <form
            className="admin-manual-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleProcessCode(manualCode);
            }}
          >
            <label htmlFor="manual-ticket-input">Atau Masukkan Kode Tiket / Nomor HP:</label>
            <div className="admin-manual-input-wrap">
              <input
                id="manual-ticket-input"
                type="text"
                placeholder="Contoh: OH-A7B8C9"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
              />
              <button type="submit" className="admin-btn" disabled={processing || !manualCode.trim()}>
                Check-in
              </button>
            </div>
          </form>

          {/* Banner Hasil Scan */}
          {scanResult && (
            <div className={`admin-scan-alert admin-scan-alert--${scanResult.type}`} role="alert">
              <div className="admin-scan-alert__icon">
                {scanResult.type === 'success' && 'OK'}
                {scanResult.type === 'duplicate' && '!'}
                {scanResult.type === 'error' && 'X'}
              </div>
              <div className="admin-scan-alert__content">
                <strong>
                  {scanResult.type === 'success' && 'Presensi Berhasil Dicatat'}
                  {scanResult.type === 'duplicate' && 'Sudah Hadir Sebelumnya'}
                  {scanResult.type === 'error' && 'Verifikasi Gagal'}
                </strong>
                <p>{scanResult.message}</p>
                {scanResult.item && (
                  <button
                    type="button"
                    className="admin-scan-alert__link"
                    onClick={() => onSelectRegistration(scanResult.item!)}
                  >
                    Buka Detail Data Peserta →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Kolom Riwayat Check-in Terkini */}
        <div className="admin-scanner-card">
          <h2>Riwayat Presensi Terbaru</h2>
          <p className="admin-scanner-desc">5 Peserta terakhir yang baru saja melakukan presensi:</p>

          {recentlyAttended.length === 0 ? (
            <p className="admin-empty-note">Belum ada peserta yang hadir.</p>
          ) : (
            <ul className="admin-recent-list">
              {recentlyAttended.map((item) => (
                <li
                  key={item.id}
                  className="admin-recent-item"
                  onClick={() => onSelectRegistration(item)}
                  tabIndex={0}
                >
                  <div className="admin-recent-main">
                    <strong>{item.child_name}</strong>
                    <span>{item.school} • {item.attendee_count} Orang</span>
                  </div>
                  <div className="admin-recent-time">
                    <span className="badge badge--attended">
                      {new Date(item.attended_at!).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <code className="admin-code">{item.ticket_code}</code>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
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
    min-height: calc(100vh - 96px);
    padding: 32px 16px;
  }
  .admin-login {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: min(100%, 420px);
    padding: 32px;
    border: 1px solid #cbd8e0;
    border-radius: 18px;
    background: #f7fbfc;
  }
  .admin-login::before {
    content: 'Ruang kerja panitia';
    color: #31706c;
    font-family: var(--font-heading);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
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
    max-width: 1180px;
    margin-inline: auto;
    padding: 32px 24px 72px;
  }
  .admin-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 28px;
    padding-bottom: 22px;
    border-bottom: 1px solid #d5e0e4;
    flex-wrap: wrap;
  }
  .admin-header__brand {
    display: flex;
    align-items: flex-end;
    gap: 24px;
    flex-wrap: wrap;
  }
  .admin-header__title {
    display: grid;
    gap: 5px;
  }
  .admin-kicker {
    margin: 0;
    color: #31706c;
    font-family: var(--font-heading);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .admin-header h1 {
    margin: 0;
    color: #20373b;
    font-size: clamp(1.45rem, 3vw, 2rem);
    letter-spacing: -0.03em;
  }
  .admin-header__hint {
    max-width: 560px;
    margin: 0;
    color: #587077;
    font-size: 0.9rem;
  }
  .admin-tabs {
    display: flex;
    gap: 4px;
    padding: 4px;
    border: 1px solid #d5e0e4;
    border-radius: 10px;
    background: #edf3f5;
  }
  .admin-tab {
    padding: 9px 14px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: #587077;
    font-family: var(--font-heading);
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
  }
  .admin-tab:hover {
    color: #22262a;
  }
  .admin-tab--active {
    background: #20373b;
    color: #ffffff;
  }
  .admin-tab--scan.admin-tab--active {
    background: #31706c;
    color: #ffffff;
  }
  .admin-summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 24px;
    padding: 0;
  }
  .admin-stat {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    min-width: 0;
    min-height: 116px;
    padding: 18px;
    border: 1px solid #d5e0e4;
    border-radius: 12px;
    background: #f7fbfc;
  }
  .admin-stat__num {
    color: #20373b;
    font-family: var(--font-heading);
    font-size: clamp(1.8rem, 4vw, 2.5rem);
    font-weight: 800;
    line-height: 1;
  }
  .admin-stat--attended .admin-stat__num {
    color: #1a7a3b;
  }
  .admin-stat--absent .admin-stat__num {
    color: #d97706;
  }
  .admin-stat__label {
    color: #587077;
    font-family: var(--font-heading);
    font-size: 0.76rem;
    font-weight: 700;
  }
  .admin-stat--sources {
    grid-column: 1 / -1;
    min-height: auto;
  }
  .admin-source-list {
    list-style: none;
    padding: 0;
    margin: 4px 0 0;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    font-size: 0.85rem;
  }
  .badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 999px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
  }
  .badge--attended {
    background: #e8f5e9;
    color: #1a7a3b;
    border: 1px solid #c8e6c9;
  }
  .badge--absent {
    background: #f4f4f0;
    color: #6b7280;
    border: 1px solid #e5e7eb;
  }
  .admin-code {
    font-family: monospace;
    font-size: 0.85rem;
    background: #eae5d7;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
    color: #1e3a8a;
  }
  .admin-toolbar {
    display: grid;
    grid-template-columns: minmax(240px, 1.6fr) repeat(3, minmax(145px, 0.8fr)) auto;
    gap: 8px;
    margin-bottom: 16px;
    padding: 14px;
    border: 1px solid #d5e0e4;
    border-radius: 12px;
    background: #f7fbfc;
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
  .admin-btn--attended {
    background: #1a7a3b;
    color: #ffffff;
    border-color: #1a7a3b;
  }
  .admin-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .admin-table-wrap {
    overflow-x: auto;
    border: 1px solid #d5e0e4;
    border-radius: 12px;
    background: #ffffff;
  }
  .admin-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.84rem;
  }
  .admin-table th {
    text-align: left;
    padding: 13px 12px;
    border-bottom: 1px solid #cbd8e0;
    background: #edf3f5;
    color: #35545b;
    white-space: nowrap;
    font-weight: 700;
  }
  .admin-table td {
    padding: 13px 12px;
    border-bottom: 1px solid #e8eef0;
    vertical-align: middle;
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
    gap: 8px 16px;
    font-size: 0.9rem;
    margin: 0;
  }
  .admin-dl dt { color: #5b6068; white-space: nowrap; font-weight: 600; }
  .admin-dl dd { margin: 0; word-break: break-word; }
  .admin-edit {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .admin-edit__section {
    padding: 12px;
    background: #f4efe4;
    border: 1px solid #e3dccb;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .admin-edit__title {
    font-weight: 600;
    font-size: 0.9rem;
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

  /* Scanner Tab Styles */
  .admin-scanner-tab {
    margin-top: 8px;
  }
  .admin-scanner-grid {
    display: grid;
    gap: 20px;
  }
  @media (min-width: 840px) {
    .admin-scanner-grid {
      grid-template-columns: 1.2fr 0.8fr;
    }
  }
  .admin-scanner-card {
    background: #f9f6ef;
    border: 2px solid #e3dccb;
    border-radius: 8px;
    padding: 20px;
  }
  .admin-scanner-card h2 {
    font-size: 1.25rem;
    margin: 0 0 4px;
    color: #22262a;
  }
  .admin-scanner-desc {
    font-size: 0.85rem;
    color: #5b6068;
    margin: 0 0 16px;
  }
  .admin-scanner-controls {
    margin-bottom: 16px;
  }
  .admin-reader-box {
    width: 100%;
    max-width: 440px;
    min-height: 10px;
    margin-inline: auto;
    border-radius: 8px;
    overflow: hidden;
  }
  .admin-reader-box--active {
    min-height: 280px;
    margin-bottom: 16px;
    background: #000000;
  }
  .admin-manual-form {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px dashed #d6cfbf;
  }
  .admin-manual-form label {
    display: block;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 6px;
    color: #22262a;
  }
  .admin-manual-input-wrap {
    display: flex;
    gap: 8px;
  }
  .admin-manual-input-wrap input {
    flex: 1;
    padding: 8px 12px;
    border: 2px solid #22262a;
    border-radius: 6px;
    font-size: 0.95rem;
    background: #ffffff;
  }
  .admin-scan-alert {
    display: flex;
    gap: 12px;
    padding: 14px;
    border-radius: 8px;
    margin-top: 16px;
    font-size: 0.9rem;
    animation: fadeIn 0.3s ease;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .admin-scan-alert__icon {
    font-size: 1.5rem;
    line-height: 1;
  }
  .admin-scan-alert__content strong {
    display: block;
    margin-bottom: 2px;
  }
  .admin-scan-alert__content p {
    margin: 0 0 6px;
  }
  .admin-scan-alert__link {
    background: none;
    border: none;
    padding: 0;
    color: inherit;
    text-decoration: underline;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
  }
  .admin-scan-alert--success {
    background: #e8f5e9;
    color: #1b5e20;
    border: 1px solid #a5d6a7;
  }
  .admin-scan-alert--duplicate {
    background: #fff8e1;
    color: #b78103;
    border: 1px solid #ffe082;
  }
  .admin-scan-alert--error {
    background: #ffebee;
    color: #b71c1c;
    border: 1px solid #ef9a9a;
  }
  .admin-recent-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .admin-recent-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    background: #ffffff;
    border: 1px solid #e3dccb;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .admin-recent-item:hover {
    background: #f4efe4;
  }
  .admin-recent-main {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .admin-recent-main strong {
    font-size: 0.9rem;
    color: #22262a;
  }
  .admin-recent-main span {
    font-size: 0.8rem;
    color: #5b6068;
  }
  .admin-recent-time {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  @media (max-width: 719px) {
    .admin-wrap {
      padding: 12px;
    }

    .admin-header {
      align-items: stretch;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    .admin-header__brand {
      align-items: stretch;
      flex-direction: column;
      gap: 12px;
    }

    .admin-header__hint {
      font-size: 0.82rem;
    }

    .admin-header h1 {
      font-size: 1.25rem;
    }

    .admin-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      width: 100%;
    }

    .admin-tab {
      min-height: 42px;
      padding-inline: 8px;
      font-size: 0.76rem;
    }

    .admin-header > .admin-btn {
      width: 100%;
    }

    .admin-summary {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      padding: 12px;
    }

    .admin-stat {
      min-width: 0;
      padding: 10px;
      border: 1px solid #e3dccb;
      border-radius: 6px;
      background: #fffdf8;
    }

    .admin-stat--sources {
      grid-column: 1 / -1;
    }

    .admin-stat__num {
      font-size: 1.65rem;
    }

    .admin-toolbar {
      display: grid;
      grid-template-columns: 1fr;
    }

    .admin-search,
    .admin-select,
    .admin-toolbar .admin-btn {
      width: 100%;
      min-height: 44px;
    }

    .admin-table-wrap {
      margin-inline: -12px;
      padding-inline: 12px;
    }

    .admin-table {
      min-width: 720px;
    }

    .admin-detail {
      gap: 16px;
    }

    .admin-dl {
      grid-template-columns: 1fr;
      gap: 4px;
      padding: 14px;
      border: 1px solid #e3dccb;
      border-radius: 6px;
      background: #f9f6ef;
    }

    .admin-dl dd {
      margin-bottom: 8px;
    }

    .admin-edit__section,
    .admin-manual-input-wrap {
      align-items: stretch;
      flex-direction: column;
    }

    .admin-edit__actions .admin-btn,
    .admin-manual-input-wrap .admin-btn {
      width: 100%;
    }

    .admin-scanner-card {
      padding: 14px;
    }

    .admin-reader-box--active {
      min-height: 240px;
    }

    .admin-recent-item {
      align-items: flex-start;
      flex-direction: column;
    }

    .admin-recent-time {
      align-items: flex-start;
    }
  }
  .admin-empty-note {
    font-size: 0.85rem;
    color: #6b7280;
    font-style: italic;
    padding: 16px 0;
  }

`;

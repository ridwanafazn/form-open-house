// src/components/admin/ListScreen.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { buildCsv, downloadCsv } from '../../lib/csv';
import type { CsvRow } from '../../lib/csv';
import { STATUS_LABELS } from './types';
import type { Registration, FollowupStatus, Screen, Tab } from './types';
import ScannerTab from './ScannerTab';
import DetailScreen from './DetailScreen';

interface ListScreenProps {
  setScreen: (s: Screen) => void;
}

export default function ListScreen({ setScreen }: ListScreenProps) {
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
          setLoadError('Gagal memuat data pendaftar.');
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

  const totalRegisteredFamilies = rows.length;
  const attendedRows = rows.filter((r) => !!r.attended_at);
  const totalAttendedFamilies = attendedRows.length;
  const totalAbsentFamilies = totalRegisteredFamilies - totalAttendedFamilies;
  const totalAttendedIndividuals = attendedRows.reduce((sum, r) => sum + r.attendee_count, 0);
  const totalExpectedIndividuals = rows.reduce((sum, r) => sum + r.attendee_count, 0);

  const sourceSummary = rows.reduce<Record<string, number>>((acc, r) => {
    const src = r.utm_source ?? 'Organik/Langsung';
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
    <div className="admin-wrap" id="dashboard">
      <header className="admin-header">
        <div className="admin-header__brand">
          <div className="admin-header__title">
            <p className="admin-kicker">Ruang Kerja Panitia</p>
            <h1>Dasbor Open House</h1>
            <p className="admin-header__hint">Pantau pendaftar, tindak lanjuti keluarga, dan catat kehadiran dari satu tempat.</p>
          </div>
          
          <div className="admin-tabs-wrapper">
            <div className="admin-tabs">
              <button
                type="button"
                className={`admin-tab ${activeTab === 'list' ? 'admin-tab--active' : ''}`}
                onClick={() => {
                  setActiveTab('list');
                  window.history.replaceState(null, '', '#dashboard');
                }}
              >
                Daftar Peserta
                <span className="admin-tab__count">{rows.length}</span>
              </button>
              <button
                type="button"
                className={`admin-tab ${activeTab === 'scan' ? 'admin-tab--active' : ''}`}
                onClick={() => {
                  setActiveTab('scan');
                  window.history.replaceState(null, '', '#scan');
                }}
              >
                Scan Presensi QR
              </button>
            </div>
          </div>
        </div>
      </header>

      {activeTab === 'scan' ? (
        <ScannerTab
          rows={rows}
          onCheckInSuccess={handleCheckInSuccess}
          onSelectRegistration={handleSelect}
        />
      ) : (
        <>
          <section className="admin-summary">
            {/* Kartu Utama (Tema Donezo) */}
            <div className="admin-stat admin-stat--primary">
              <div className="admin-stat__header">Total Keluarga</div>
              <div className="admin-stat__num">{totalRegisteredFamilies}</div>
              <div className="admin-stat__footer">↗ Terdaftar dalam sistem</div>
            </div>
            
            <div className="admin-stat">
              <div className="admin-stat__header">Peserta Hadir</div>
              <div className="admin-stat__num text-emerald">{totalAttendedFamilies}</div>
              <div className="admin-stat__footer">Hadir: {totalAttendedIndividuals} Individu</div>
            </div>
            
            <div className="admin-stat">
              <div className="admin-stat__header">Belum Hadir</div>
              <div className="admin-stat__num text-amber">{totalAbsentFamilies}</div>
              <div className="admin-stat__footer">Keluarga belum check-in</div>
            </div>
            
            <div className="admin-stat">
              <div className="admin-stat__header">Estimasi Hadirin</div>
              <div className="admin-stat__num text-slate">{totalExpectedIndividuals}</div>
              <div className="admin-stat__footer">Total target individu</div>
            </div>
          </section>

          <div className="admin-toolbar">
            <div className="admin-search-wrapper">
              <svg className="admin-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                className="admin-search"
                type="search"
                placeholder="Cari nama, tiket (OH-...), atau nomor HP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="admin-filters">
              <select
                className="admin-select"
                value={filterAttendance}
                onChange={(e) => setFilterAttendance(e.target.value as 'all' | 'attended' | 'absent')}
              >
                <option value="all">Semua Presensi</option>
                <option value="attended">Sudah Hadir ({totalAttendedFamilies})</option>
                <option value="absent">Belum Hadir ({totalAbsentFamilies})</option>
              </select>
              <select
                className="admin-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Semua Status</option>
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
                  <option value="">Semua PIC</option>
                  {assignees.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              )}
              <button className="admin-btn admin-btn--outline" onClick={handleExport}>
                Ekspor CSV
              </button>
            </div>
          </div>

          {loading && (
            <div className="admin-loading-state">
              <div className="admin-spinner"></div>
              <p>Memuat data pendaftar...</p>
            </div>
          )}
          {loadError && <p className="admin-msg admin-msg--error">{loadError}</p>}

          {!loading && !loadError && (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Presensi</th>
                    <th>Kode Tiket</th>
                    <th>Nama Pendaftar</th>
                    <th>Asal Kota</th>
                    <th>Asal Sekolah</th>
                    <th>Rombongan</th>
                    <th>Status Tindak Lanjut</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="admin-table__empty">
                        <div className="admin-empty-state">
                          <p>Tidak ada data yang sesuai filter pencarian.</p>
                        </div>
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
                          <span className="badge badge--success" title={`Hadir: ${new Date(r.attended_at).toLocaleString('id-ID')}`}>
                            ✓ {new Date(r.attended_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : (
                          <span className="badge badge--neutral">Belum Hadir</span>
                        )}
                      </td>
                      <td>
                        <code className="admin-code">{r.ticket_code || '—'}</code>
                      </td>
                      <td>
                        <div className="admin-cell-user">
                          <strong>{r.child_name}</strong>
                          <span>{r.parent_phone}</span>
                        </div>
                      </td>
                      <td>{r.city}</td>
                      <td>{r.school}</td>
                      <td>{r.attendee_count} Org</td>
                      <td>
                        <div className="admin-cell-status">
                          <span className="admin-status-text">{STATUS_LABELS[r.followup_status] ?? r.followup_status}</span>
                          {r.assigned_to && <span className="admin-pic-chip">{r.assigned_to}</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
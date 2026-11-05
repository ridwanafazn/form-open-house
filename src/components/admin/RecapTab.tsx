// src/components/admin/RecapTab.tsx
import { useMemo, useState } from 'react';
import { STATUS_LABELS } from './types';
import type { FollowupStatus, Registration } from './types';

interface RecapTabProps {
  rows: Registration[];
  onSelectRegistration: (r: Registration) => void;
}

type RecapFilter = 'all' | 'attended' | 'absent' | 'cancelled' | 'pmb';

const FOLLOWUP_ORDER: FollowupStatus[] = [
  'belum_dihubungi',
  'sudah_dihubungi',
  'merespons',
  'tertarik',
  'sudah_daftar_pmb',
  'tidak_jadi',
];

const FOLLOWUP_COLORS: Record<FollowupStatus, string> = {
  belum_dihubungi: '#94A3B8',
  sudah_dihubungi: '#0EA5E9',
  merespons: '#14B8A6',
  tertarik: '#D97706',
  sudah_daftar_pmb: '#0F766E',
  tidak_jadi: '#DC2626',
};

function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export default function RecapTab({ rows, onSelectRegistration }: RecapTabProps) {
  const [filter, setFilter] = useState<RecapFilter>('all');

  const activeRows = useMemo(() => rows.filter((r) => r.followup_status !== 'tidak_jadi'), [rows]);
  const attendedRows = useMemo(() => activeRows.filter((r) => !!r.attended_at), [activeRows]);
  const absentRows = useMemo(() => activeRows.filter((r) => !r.attended_at), [activeRows]);
  const cancelledRows = useMemo(
    () => rows.filter((r) => r.followup_status === 'tidak_jadi'),
    [rows],
  );
  const pmbRows = useMemo(
    () => rows.filter((r) => r.followup_status === 'sudah_daftar_pmb'),
    [rows],
  );
  const pmbAttended = useMemo(() => pmbRows.filter((r) => !!r.attended_at), [pmbRows]);

  const totalIndividuals = activeRows.reduce((sum, r) => sum + r.attendee_count, 0);
  const attendedIndividuals = attendedRows.reduce((sum, r) => sum + r.attendee_count, 0);
  const attendanceRate = percent(attendedRows.length, activeRows.length);

  const chartTotal = rows.length || 1;
  const attendedPct = (attendedRows.length / chartTotal) * 100;
  const absentPct = (absentRows.length / chartTotal) * 100;
  const cancelledPct = (cancelledRows.length / chartTotal) * 100;
  const donutBackground =
    rows.length === 0
      ? '#E2E8F0'
      : `conic-gradient(#059669 0 ${attendedPct}%, #D97706 ${attendedPct}% ${
          attendedPct + absentPct
        }%, #DC2626 ${attendedPct + absentPct}% 100%)`;

  const statusCounts = FOLLOWUP_ORDER.map((status) => ({
    status,
    count: rows.filter((r) => r.followup_status === status).length,
  }));
  const maxStatusCount = Math.max(1, ...statusCounts.map((s) => s.count));

  const filteredRows = useMemo(() => {
    switch (filter) {
      case 'attended':
        return attendedRows;
      case 'absent':
        return absentRows;
      case 'cancelled':
        return cancelledRows;
      case 'pmb':
        return pmbRows;
      default:
        return rows;
    }
  }, [filter, rows, attendedRows, absentRows, cancelledRows, pmbRows]);

  const filters: Array<{ key: RecapFilter; label: string; count: number }> = [
    { key: 'all', label: 'Semua', count: rows.length },
    { key: 'attended', label: 'Hadir', count: attendedRows.length },
    { key: 'absent', label: 'Belum hadir', count: absentRows.length },
    { key: 'cancelled', label: 'Tidak jadi', count: cancelledRows.length },
    { key: 'pmb', label: 'Sudah daftar PMB', count: pmbRows.length },
  ];

  return (
    <section className="recap">
      <header className="recap__header">
        <p className="admin-kicker">Rekap Acara</p>
        <h2>Ringkasan kehadiran Open House</h2>
        <p>
          Data dihitung dari status tindak lanjut dan presensi. Pendaftar berstatus Tidak jadi tidak
          dihitung sebagai peserta aktif.
        </p>
      </header>

      <div className="recap__stats">
        <article className="recap-stat">
          <span className="recap-stat__label">Pendaftar</span>
          <strong className="recap-stat__value">{rows.length}</strong>
          <span className="recap-stat__hint">Seluruh data masuk</span>
        </article>
        <article className="recap-stat recap-stat--green">
          <span className="recap-stat__label">Hadir</span>
          <strong className="recap-stat__value">{attendedRows.length}</strong>
          <span className="recap-stat__hint">{attendedIndividuals} individu</span>
        </article>
        <article className="recap-stat recap-stat--amber">
          <span className="recap-stat__label">Belum hadir</span>
          <strong className="recap-stat__value">{absentRows.length}</strong>
          <span className="recap-stat__hint">Peserta aktif</span>
        </article>
        <article className="recap-stat recap-stat--red">
          <span className="recap-stat__label">Tidak jadi</span>
          <strong className="recap-stat__value">{cancelledRows.length}</strong>
          <span className="recap-stat__hint">Tidak dihitung aktif</span>
        </article>
        <article className="recap-stat recap-stat--teal">
          <span className="recap-stat__label">Sudah daftar PMB</span>
          <strong className="recap-stat__value">{pmbRows.length}</strong>
          <span className="recap-stat__hint">{pmbAttended.length} sudah hadir</span>
        </article>
      </div>

      <div className="recap__charts">
        <article className="admin-card recap-chart">
          <div className="admin-card__header">
            <h2>Komposisi kehadiran</h2>
            <p>Perbandingan hadir, belum hadir, dan tidak jadi.</p>
          </div>
          <div className="recap-donut-wrap">
            <div
              className="recap-donut"
              style={{ background: donutBackground }}
              role="img"
              aria-label={`Hadir ${attendedRows.length}, belum hadir ${absentRows.length}, tidak jadi ${cancelledRows.length}`}
            >
              <div className="recap-donut__hole">
                <strong>{attendanceRate}%</strong>
                <span>kehadiran aktif</span>
              </div>
            </div>
            <ul className="recap-legend" role="list">
              <li>
                <span className="recap-legend__dot recap-legend__dot--green" />
                Hadir
                <strong>{attendedRows.length}</strong>
              </li>
              <li>
                <span className="recap-legend__dot recap-legend__dot--amber" />
                Belum hadir
                <strong>{absentRows.length}</strong>
              </li>
              <li>
                <span className="recap-legend__dot recap-legend__dot--red" />
                Tidak jadi
                <strong>{cancelledRows.length}</strong>
              </li>
            </ul>
          </div>
          <dl className="recap-summary-list">
            <div>
              <dt>Total rombongan terdaftar</dt>
              <dd>{rows.reduce((sum, r) => sum + r.attendee_count, 0)} orang</dd>
            </div>
            <div>
              <dt>Rombongan aktif</dt>
              <dd>{totalIndividuals} orang</dd>
            </div>
            <div>
              <dt>Rombongan sudah hadir</dt>
              <dd>{attendedIndividuals} orang</dd>
            </div>
          </dl>
        </article>

        <article className="admin-card recap-chart">
          <div className="admin-card__header">
            <h2>Status tindak lanjut</h2>
            <p>Sebaran status percakapan panitia dengan pendaftar.</p>
          </div>
          <div className="recap-bars">
            {statusCounts.map(({ status, count }) => (
              <div className="recap-bar-row" key={status}>
                <div className="recap-bar-row__head">
                  <span>{STATUS_LABELS[status]}</span>
                  <strong>{count}</strong>
                </div>
                <div className="recap-bar-track">
                  <span
                    className="recap-bar-fill"
                    style={{
                      width: `${(count / maxStatusCount) * 100}%`,
                      background: FOLLOWUP_COLORS[status],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="recap-note">
            Kategori Sudah daftar PMB mengikuti status tindak lanjut yang tercatat di sistem.
          </p>
        </article>
      </div>

      <article className="admin-card recap-list">
        <div className="admin-card__header recap-list__head">
          <div>
            <h2>Daftar nama</h2>
            <p>Pilih kategori untuk melihat nama yang masuk ke tiap kelompok.</p>
          </div>
          <div className="recap-filters" role="group" aria-label="Filter kategori rekap">
            {filters.map((item) => (
              <button
                type="button"
                key={item.key}
                className={`recap-filter${filter === item.key ? ' recap-filter--active' : ''}`}
                onClick={() => setFilter(item.key)}
              >
                {item.label}
                <span>{item.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Rombongan</th>
                <th>Kehadiran</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="admin-table__empty">
                    <div className="admin-empty-state">
                      <p>Belum ada data untuk kategori ini.</p>
                    </div>
                  </td>
                </tr>
              )}
              {filteredRows.map((r) => (
                <tr
                  key={r.id}
                  className="admin-table__row"
                  onClick={() => onSelectRegistration(r)}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onSelectRegistration(r)}
                >
                  <td>
                    <div className="admin-cell-user">
                      <strong>{r.child_name}</strong>
                      <span>{r.school}</span>
                    </div>
                  </td>
                  <td data-label="Rombongan">{r.attendee_count} orang</td>
                  <td data-label="Kehadiran">
                    {r.followup_status === 'tidak_jadi' ? (
                      <span className="badge badge--neutral">Tidak dihitung</span>
                    ) : r.attended_at ? (
                      <span className="badge badge--success">
                        Hadir{' '}
                        {new Date(r.attended_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    ) : (
                      <span className="badge badge--neutral">Belum hadir</span>
                    )}
                  </td>
                  <td data-label="Status">
                    <span className="admin-status-text">
                      {STATUS_LABELS[r.followup_status] ?? r.followup_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <style>{`
        .recap {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .recap__header {
          max-width: 720px;
        }
        .recap__header h2 {
          margin: 4px 0 6px;
          font-family: 'Space Grotesk', sans-serif;
          font-size: clamp(1.4rem, 3vw, 1.9rem);
          color: var(--admin-primary);
        }
        .recap__header > p:last-child {
          margin: 0;
          color: var(--admin-text-muted);
          font-size: 0.92rem;
          line-height: 1.55;
        }
        .recap__stats {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
        }
        .recap-stat {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 18px;
          border: 1px solid var(--admin-border);
          border-radius: var(--radius-md);
          background: var(--admin-surface);
        }
        .recap-stat__label {
          color: var(--admin-text-muted);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .recap-stat__value {
          color: var(--admin-primary);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.8rem;
          line-height: 1;
        }
        .recap-stat__hint {
          color: #94A3B8;
          font-size: 0.76rem;
        }
        .recap-stat--green .recap-stat__value { color: #059669; }
        .recap-stat--amber .recap-stat__value { color: #D97706; }
        .recap-stat--red .recap-stat__value { color: #DC2626; }
        .recap-stat--teal .recap-stat__value { color: #0F766E; }
        .recap__charts {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .recap-chart { min-width: 0; }
        .recap-donut-wrap {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 8px 0 18px;
        }
        .recap-donut {
          position: relative;
          width: 168px;
          height: 168px;
          flex: none;
          border-radius: 50%;
        }
        .recap-donut__hole {
          position: absolute;
          inset: 22px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          border-radius: 50%;
          background: var(--admin-surface);
          text-align: center;
        }
        .recap-donut__hole strong {
          color: var(--admin-primary);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 1.9rem;
          line-height: 1;
        }
        .recap-donut__hole span {
          color: var(--admin-text-muted);
          font-size: 0.68rem;
          font-weight: 600;
        }
        .recap-legend {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .recap-legend li {
          display: grid;
          grid-template-columns: 10px 1fr auto;
          align-items: center;
          gap: 8px;
          color: var(--admin-text-muted);
          font-size: 0.86rem;
        }
        .recap-legend strong { color: var(--admin-primary); }
        .recap-legend__dot {
          width: 10px;
          height: 10px;
          border-radius: 3px;
        }
        .recap-legend__dot--green { background: #059669; }
        .recap-legend__dot--amber { background: #D97706; }
        .recap-legend__dot--red { background: #DC2626; }
        .recap-summary-list {
          display: grid;
          gap: 10px;
          margin: 0;
          padding-top: 14px;
          border-top: 1px solid var(--admin-border);
        }
        .recap-summary-list div {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }
        .recap-summary-list dt {
          color: var(--admin-text-muted);
          font-size: 0.84rem;
        }
        .recap-summary-list dd {
          margin: 0;
          color: var(--admin-primary);
          font-size: 0.84rem;
          font-weight: 700;
        }
        .recap-bars {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 8px 0 16px;
        }
        .recap-bar-row__head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 5px;
          color: var(--admin-text-muted);
          font-size: 0.84rem;
        }
        .recap-bar-row__head strong { color: var(--admin-primary); }
        .recap-bar-track {
          height: 8px;
          overflow: hidden;
          border-radius: 999px;
          background: var(--admin-bg);
        }
        .recap-bar-fill {
          display: block;
          height: 100%;
          border-radius: inherit;
          transition: width 0.3s ease;
        }
        .recap-note {
          margin: 0;
          padding-top: 12px;
          border-top: 1px solid var(--admin-border);
          color: #94A3B8;
          font-size: 0.78rem;
          line-height: 1.5;
        }
        .recap-list__head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .recap-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .recap-filter {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border: 1px solid var(--admin-border);
          border-radius: 8px;
          background: var(--admin-surface);
          color: var(--admin-text-muted);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
        }
        .recap-filter span {
          padding: 1px 6px;
          border-radius: 999px;
          background: var(--admin-bg);
          font-size: 0.7rem;
        }
        .recap-filter--active {
          border-color: var(--admin-primary);
          background: var(--admin-primary);
          color: #FFFFFF;
        }
        .recap-filter--active span {
          background: rgba(255, 255, 255, 0.16);
          color: #FFFFFF;
        }
        @media (max-width: 1024px) {
          .recap__stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 860px) {
          .recap__charts { grid-template-columns: minmax(0, 1fr); }
        }
        @media (max-width: 600px) {
          .recap__stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .recap-donut-wrap {
            flex-direction: column;
            align-items: flex-start;
          }
          .recap-list__head { flex-direction: column; }
        }
        @media (max-width: 720px) {
          .recap-list .admin-table-wrap {
            overflow: visible;
            border: 0;
            background: transparent;
          }
          .recap-list .admin-table,
          .recap-list .admin-table thead,
          .recap-list .admin-table tbody,
          .recap-list .admin-table tr,
          .recap-list .admin-table td {
            display: block;
            width: 100%;
          }
          .recap-list .admin-table thead { display: none; }
          .recap-list .admin-table tr {
            margin-bottom: 10px;
            padding: 12px 14px;
            border: 1px solid var(--admin-border);
            border-radius: 10px;
            background: var(--admin-surface);
          }
          .recap-list .admin-table td {
            padding: 4px 0;
            border: 0;
          }
          .recap-list .admin-table td + td {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
          }
          .recap-list .admin-table td + td::before {
            content: attr(data-label);
            color: var(--admin-text-muted);
            font-size: 0.76rem;
            font-weight: 600;
          }
          .recap-list .admin-table__empty {
            padding: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .recap-bar-fill { transition: none; }
        }
      `}</style>
    </section>
  );
}

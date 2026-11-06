import { useMemo, useState } from 'react';
import { content } from '../config/content';
import { tourSessions, type GroupCode } from '../config/groups';

export interface GroupMember {
  name: string;
  school: string;
}

export interface PublicGroup {
  code: GroupCode;
  label: string;
  stops: readonly string[];
  returnStop: string | null;
  returnLabel: string | null;
  note: string;
  members: GroupMember[];
}

interface GroupDirectoryProps {
  groups: PublicGroup[];
  loadError: string;
}

const copy = content.groupPage;

export default function GroupDirectory({ groups, loadError }: GroupDirectoryProps) {
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) {
      return groups.map((group) => ({ group, members: group.members }));
    }

    return groups
      .map((group) => ({
        group,
        members: group.members.filter((member) =>
          [member.name, member.school].some((value) =>
            value.toLowerCase().includes(normalizedQuery),
          ),
        ),
      }))
      .filter((entry) => entry.members.length > 0);
  }, [groups, normalizedQuery]);

  const matchCount = useMemo(
    () => filteredGroups.reduce((total, entry) => total + entry.members.length, 0),
    [filteredGroups],
  );

  const hasAnyMember = groups.some((group) => group.members.length > 0);

  return (
    <>
      <style>{`
        .group-toolbar {
          margin-bottom: 20px;
          padding: 16px;
          border: 1px solid var(--paper-grid);
          border-radius: 12px;
          background: var(--paper-card);
        }
        .group-search {
          width: 100%;
          min-width: 0;
        }
        .group-search-row {
          display: flex;
          align-items: stretch;
          gap: 12px;
        }
        .group-search label {
          display: block;
          margin-bottom: 6px;
          color: var(--ink);
          font-size: 0.8rem;
          font-weight: 700;
        }
        .group-search input {
          flex: 1 1 auto;
          width: 100%;
          min-width: 0;
          min-height: 44px;
          padding: 10px 12px;
          border: 1px solid var(--paper-grid);
          border-radius: 6px;
          background: #ffffff;
          color: var(--ink);
          font-family: var(--font-body);
          font-size: 1rem;
        }
        .group-search input:focus {
          outline: 2px solid var(--ink);
          outline-offset: 1px;
        }
        .group-search p {
          margin: 6px 0 0;
          color: var(--ink-soft);
          font-size: 0.72rem;
          line-height: 1.4;
        }
        .group-print {
          flex: none;
          min-height: 44px;
          padding: 10px 16px;
          border: 1px solid var(--ink);
          border-radius: 6px;
          background: var(--ink);
          color: #ffffff;
          font-family: var(--font-heading);
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
        }
        .group-print:hover {
          background: #3a4047;
        }
        .group-result-note {
          margin: 0 0 16px;
          color: var(--ink-soft);
          font-size: 0.8rem;
        }
        .group-cards {
          display: grid;
          gap: 16px;
        }
        @media (min-width: 760px) {
          .group-cards {
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            align-items: start;
          }
        }
        .group-card {
          overflow: hidden;
          border: 1px solid var(--paper-grid);
          border-radius: 14px;
          background: #ffffff;
        }
        .group-card__head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px;
          border-bottom: 1px solid var(--paper-grid);
          background: var(--paper-card);
        }
        .group-card__identity {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .group-card__code {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          flex: none;
          border-radius: 8px;
          background: var(--ink);
          color: #ffffff;
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 700;
        }
        .group-card__identity h2 {
          margin: 0;
          color: var(--ink);
          font-family: var(--font-heading);
          font-size: 1rem;
          line-height: 1.2;
        }
        .group-card__body {
          display: grid;
          gap: 16px;
          padding: 16px;
        }
        .group-block h3 {
          margin: 0 0 8px;
          color: var(--ink-soft);
          font-family: var(--font-tech);
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .group-route {
          display: grid;
          gap: 6px;
          margin: 0;
          padding: 0;
          list-style: none;
          counter-reset: route;
        }
        .group-route li {
          display: grid;
          grid-template-columns: 22px minmax(0, 1fr);
          gap: 8px;
          align-items: start;
          color: var(--ink);
          font-size: 0.82rem;
          line-height: 1.4;
          counter-increment: route;
        }
        .group-route li::before {
          content: counter(route);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border: 1px solid var(--paper-grid);
          border-radius: 50%;
          background: var(--paper-card);
          color: var(--ink-soft);
          font-family: var(--font-tech);
          font-size: 0.6rem;
          font-weight: 700;
        }
        .group-route__return {
          color: var(--teal-dark);
          font-weight: 700;
        }
        .group-route__note {
          margin: 8px 0 0;
          color: var(--ink-soft);
          font-size: 0.72rem;
          line-height: 1.45;
        }
        .group-sessions {
          display: grid;
          gap: 6px;
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .group-sessions li {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
          padding-bottom: 5px;
          border-bottom: 1px dashed var(--paper-grid);
          color: var(--ink-soft);
          font-size: 0.74rem;
        }
        .group-sessions li:last-child {
          border-bottom: 0;
        }
        .group-sessions strong {
          color: var(--ink);
          font-size: 0.76rem;
          text-align: right;
        }
        .group-members {
          display: grid;
          gap: 8px;
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .group-member {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 10px;
          border: 1px solid var(--paper-grid);
          border-radius: 6px;
          background: var(--paper-card);
        }
        .group-member__identity {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .group-member__identity strong {
          color: var(--ink);
          font-size: 0.82rem;
          line-height: 1.3;
          overflow-wrap: anywhere;
        }
        .group-member__identity span {
          color: var(--ink-soft);
          font-size: 0.7rem;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }
        .group-empty {
          padding: 32px 20px;
          border: 1px dashed var(--paper-grid);
          border-radius: 12px;
          background: #ffffff;
          text-align: center;
        }
        .group-empty h2 {
          margin: 0 0 6px;
          color: var(--ink);
          font-family: var(--font-heading);
          font-size: 1.1rem;
        }
        .group-empty p {
          max-width: 52ch;
          margin: 0 auto;
          color: var(--ink-soft);
          font-size: 0.85rem;
          line-height: 1.5;
        }
        @media (max-width: 600px) {
          .group-search-row {
            flex-direction: column;
          }
          .group-print {
            width: 100%;
          }
        }
        @media print {
          .group-toolbar,
          .group-result-note {
            display: none !important;
          }
          .group-cards {
            display: block;
          }
          .group-card {
            break-inside: avoid;
            margin-bottom: 12px;
            border-color: #000000;
          }
          .group-card__head,
          .group-member {
            background: #ffffff;
          }
          .group-member {
            break-inside: avoid;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .group-print {
            transition: none;
          }
        }
      `}</style>

      {loadError ? (
        <div className="group-empty" role="alert">
          <h2>{copy.loadErrorTitle}</h2>
          <p>{copy.loadErrorText}</p>
        </div>
      ) : (
        <>
          <div className="group-toolbar">
            <div className="group-search">
              <label htmlFor="group-search-input">{copy.searchLabel}</label>
              <div className="group-search-row">
                <input
                  id="group-search-input"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  autoComplete="off"
                />
                <button type="button" className="group-print" onClick={() => window.print()}>
                  {copy.print}
                </button>
              </div>
              <p>{copy.searchHint}</p>
            </div>
          </div>

          {!hasAnyMember && (
            <div className="group-empty">
              <h2>{copy.emptyTitle}</h2>
              <p>{copy.emptyText}</p>
            </div>
          )}

          {hasAnyMember && normalizedQuery && (
            <p className="group-result-note" aria-live="polite">
              {copy.resultsLabel.replace('{count}', String(matchCount))}
            </p>
          )}

          {hasAnyMember && normalizedQuery && filteredGroups.length === 0 && (
            <div className="group-empty">
              <h2>{copy.noMatchTitle}</h2>
              <p>{copy.noMatchText}</p>
            </div>
          )}

          {hasAnyMember && (
            <div className="group-cards">
              {filteredGroups.map(({ group, members }) => (
                <article className="group-card" key={group.code}>
                  <header className="group-card__head">
                    <div className="group-card__identity">
                      <span className="group-card__code" aria-hidden="true">
                        {group.code}
                      </span>
                      <div>
                        <h2>{group.label}</h2>
                      </div>
                    </div>
                  </header>

                  <div className="group-card__body">
                    <div className="group-block">
                      <h3>{copy.routeLabel}</h3>
                      <ol className="group-route">
                        {group.stops.map((stop) => (
                          <li key={`${group.code}-${stop}`}>{stop}</li>
                        ))}
                        {group.returnLabel && (
                          <li className="group-route__return">{group.returnLabel}</li>
                        )}
                      </ol>
                      <p className="group-route__note">{group.note}</p>
                    </div>

                    <div className="group-block">
                      <h3>{copy.sessionsLabel}</h3>
                      <ul className="group-sessions">
                        {tourSessions.map((session) => (
                          <li key={`${group.code}-sesi-${session.number}`}>
                            <span>
                              Sesi {session.number}, {session.time}
                            </span>
                            <strong>{session.locations[group.code]}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="group-block">
                      <h3>{copy.membersLabel}</h3>
                      {members.length === 0 ? (
                        <p className="group-route__note">{copy.emptyText}</p>
                      ) : (
                        <ul className="group-members">
                          {members.map((member, index) => (
                            <li
                              className="group-member"
                              key={`${group.code}-${member.name}-${member.school}-${index}`}
                            >
                              <div className="group-member__identity">
                                <strong>{member.name}</strong>
                                <span>{member.school}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

        </>
      )}
    </>
  );
}

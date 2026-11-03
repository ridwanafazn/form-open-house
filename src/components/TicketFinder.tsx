import { useEffect, useState } from 'react';
import { content } from '../config/content';

interface TicketMatch {
  child_name: string;
  attendee_count: number;
  city: string;
  school: string;
  ticket_code: string;
}

const copy = content.ticketFinder;

type Status = 'idle' | 'loading' | 'success' | 'empty' | 'error';

const errorMessages: Record<string, string> = {
  invalid: copy.invalid,
  rate_limited: copy.rateLimited,
  server: copy.server,
  not_found: copy.emptyText,
};

export default function TicketFinder() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [tickets, setTickets] = useState<TicketMatch[]>([]);
  const [message, setMessage] = useState('');

  // Izinkan tautan berbagi seperti /cari-tiket?q=OH-XXXXXX langsung mencari.
  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('q');
    if (initial) {
      setQuery(initial);
      void search(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      setStatus('error');
      setMessage(copy.invalid);
      return;
    }

    setStatus('loading');
    setMessage('');
    setTickets([]);

    try {
      const response = await fetch('/api/ticket-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        tickets?: TicketMatch[];
        error?: string;
      };

      if (response.ok && data.ok && data.tickets?.length) {
        setTickets(data.tickets);
        setStatus('success');
        return;
      }

      if (response.status === 404 || data.error === 'not_found') {
        setStatus('empty');
        return;
      }

      setStatus('error');
      setMessage(errorMessages[data.error ?? 'server'] ?? copy.server);
    } catch {
      setStatus('error');
      setMessage(copy.server);
    }
  }

  return (
    <div className="finder">
      <form
        className="finder__form"
        onSubmit={(event) => {
          event.preventDefault();
          void search(query);
        }}
      >
        <label className="finder__label" htmlFor="ticket-query">
          {copy.label}
        </label>
        <div className="finder__row">
          <input
            id="ticket-query"
            className="finder__input"
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.placeholder}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-describedby="ticket-hint"
          />
          <button type="submit" className="button button--primary finder__submit">
            {status === 'loading' ? copy.searching : copy.submit}
          </button>
        </div>
        <p className="finder__hint" id="ticket-hint">
          {copy.hint}
        </p>
      </form>

      <div className="finder__results" aria-live="polite">
        {status === 'loading' && <p className="finder__status">{copy.searching}</p>}

        {status === 'empty' && (
          <div className="finder__empty">
            <h2>{copy.emptyTitle}</h2>
            <p>{copy.emptyText}</p>
          </div>
        )}

        {status === 'error' && <p className="finder__error">{message}</p>}

        {status === 'success' && (
          <>
            <h2 className="finder__results-title">{copy.resultsHeading}</h2>
            {tickets.length > 1 && <p className="finder__multiple">{copy.multiple}</p>}
            <ul className="finder__list">
              {tickets.map((ticket) => (
                <li key={ticket.ticket_code} className="finder__item">
                  <div className="finder__item-head">
                    <h3>{ticket.child_name}</h3>
                    <code className="finder__code">{ticket.ticket_code}</code>
                  </div>
                  <p className="finder__meta">
                    {ticket.attendee_count} {copy.attendees}
                    {ticket.school ? `, ${ticket.school}` : ''}
                    {ticket.city ? `, ${ticket.city}` : ''}
                  </p>
                  <a
                    className="button button--secondary finder__open"
                    href={`/e-ticket/${ticket.ticket_code}`}
                  >
                    {copy.open}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <style>{`
        .finder {
          max-width: 640px;
          margin: 0 auto;
        }
        .finder__form {
          padding: 20px;
          border: 1px solid var(--paper-grid);
          border-radius: 12px;
          background: #ffffff;
        }
        .finder__label {
          display: block;
          margin-bottom: 8px;
          color: var(--teal-dark);
          font-family: var(--font-heading);
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .finder__row {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .finder__input {
          width: 100%;
          min-height: 46px;
          padding: 10px 14px;
          border: 1px solid var(--paper-grid);
          border-radius: 8px;
          background: var(--paper-card);
          color: var(--ink);
          font-family: var(--font-tech);
          font-size: 0.95rem;
          letter-spacing: 0.02em;
        }
        .finder__input:focus {
          border-color: var(--teal-dark);
          outline: 2px solid var(--teal-pale);
          outline-offset: 1px;
        }
        .finder__submit {
          width: 100%;
        }
        .finder__hint {
          margin: 8px 0 0;
          color: var(--ink-soft);
          font-size: 0.78rem;
          line-height: 1.5;
        }
        .finder__results {
          margin-top: 16px;
        }
        .finder__status,
        .finder__error,
        .finder__empty,
        .finder__multiple,
        .finder__results-title {
          margin: 0;
          font-size: 0.9rem;
        }
        .finder__status {
          color: var(--ink-soft);
        }
        .finder__error {
          padding: 12px 14px;
          border-left: 3px solid var(--error);
          border-radius: 0 8px 8px 0;
          background: #fdf1f1;
          color: var(--error);
        }
        .finder__empty {
          padding: 16px;
          border: 1px solid var(--paper-grid);
          border-radius: 12px;
          background: var(--paper-card);
        }
        .finder__empty h2 {
          margin: 0 0 4px;
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 700;
        }
        .finder__empty p {
          margin: 0;
          color: var(--ink-soft);
          font-size: 0.88rem;
          line-height: 1.55;
        }
        .finder__results-title {
          margin-bottom: 4px;
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 700;
        }
        .finder__multiple {
          margin-bottom: 10px;
          color: var(--ink-soft);
          font-size: 0.82rem;
          line-height: 1.5;
        }
        .finder__list {
          display: grid;
          gap: 10px;
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .finder__item {
          padding: 16px;
          border: 1px solid var(--paper-grid);
          border-radius: 12px;
          background: #ffffff;
        }
        .finder__item-head {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          justify-content: space-between;
          gap: 6px 12px;
        }
        .finder__item-head h3 {
          margin: 0;
          font-family: var(--font-heading);
          font-size: 1.05rem;
          font-weight: 700;
          line-height: 1.35;
        }
        .finder__code {
          padding: 2px 6px;
          border: 1px solid var(--paper-grid);
          border-radius: 2px;
          background: var(--paper-card);
          color: var(--teal-dark);
          font-family: var(--font-tech);
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.06em;
        }
        .finder__meta {
          margin: 4px 0 12px;
          color: var(--ink-soft);
          font-size: 0.85rem;
          line-height: 1.5;
        }
        .finder__open {
          width: 100%;
        }
        @media (min-width: 560px) {
          .finder__row {
            flex-direction: row;
          }
          .finder__submit {
            width: auto;
            flex: none;
            padding-inline: 22px;
          }
          .finder__open {
            width: auto;
          }
        }
      `}</style>
    </div>
  );
}

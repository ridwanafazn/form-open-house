import { content } from '../config/content';

const reminder = content.home.panduan.ticket;

/** Pengingat singkat yang tampil di tiket, sebelum peserta berangkat. */
export default function TicketReminder() {
  return (
    <aside className="ticket-reminder" aria-label={reminder.label}>
      <span className="ticket-reminder__label">{reminder.label}</span>
      <ul className="ticket-reminder__list">
        {reminder.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <a className="ticket-reminder__link" href="/#panduan">
        {reminder.link}
      </a>

      <style>{`
        .ticket-reminder {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin: 0 16px;
          padding: 14px 0 16px;
          border-top: 1px dashed var(--paper-grid);
        }
        .ticket-reminder__label {
          color: var(--ink-soft);
          font-family: var(--font-tech);
          font-size: 0.64rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          line-height: 1.6;
          text-transform: uppercase;
        }
        .ticket-reminder__list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin: 0;
          padding: 0;
          list-style: none;
          color: var(--ink-soft);
          font-size: 0.8rem;
          line-height: 1.5;
        }
        .ticket-reminder__link {
          width: fit-content;
          color: var(--teal-dark);
          font-size: 0.78rem;
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .ticket-reminder__link:hover {
          color: var(--ink);
        }
      `}</style>
    </aside>
  );
}

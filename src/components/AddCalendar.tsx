import { buildGoogleCalendarUrl } from '../lib/calendar';
import { content } from '../config/content';

export default function CalendarButton() {
  // Tombol langsung membuka Google Calendar dengan data acara terisi,
  // bukan mengunduh berkas .ics.
  return (
    <a
      className="button button--secondary"
      href={buildGoogleCalendarUrl()}
      target="_blank"
      rel="noopener noreferrer"
    >
      {content.thankyou.nextSteps.addCalendar}
    </a>
  );
}

import { eventConfig } from '../config/event';

// Menghasilkan berkas .ics (VCS) di browser dari eventConfig.
// Mengembalikan href data:. Dipakai untuk "Tambah ke kalender".

function dateTimeToISO(date: string, time: string): string {
  return `${date.replace(/-/g, '')}T${time.replace(/:/g, '')}00`;
}

function esc(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

export function buildCalendar(fileName = 'open-house.ics'): { href: string; download: string } {
  const uid = `${eventConfig.dateISO}-open-house-asyifa`;
  const start = dateTimeToISO(eventConfig.dateISO, eventConfig.startTime);
  const end = dateTimeToISO(eventConfig.dateISO, eventConfig.endTime);
  const now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Open House SMKIT As Syifa//ID',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `SUMMARY:${esc(eventConfig.name)}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `LOCATION:${esc(eventConfig.locationAddress)}`,
    `DESCRIPTION:${esc(eventConfig.locationName)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  return { href: url, download: fileName };
}

/**
 * Tautan "Tambah ke kalender" yang membuka Google Calendar langsung (tanpa
 * mengunduh berkas). Waktu memakai zona Asia/Jakarta via parameter ctz.
 */
export function buildGoogleCalendarUrl(): string {
  const start = dateTimeToISO(eventConfig.dateISO, eventConfig.startTime);
  const end = dateTimeToISO(eventConfig.dateISO, eventConfig.endTime);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventConfig.name,
    dates: `${start}/${end}`,
    ctz: eventConfig.timezone,
    location: eventConfig.locationAddress,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

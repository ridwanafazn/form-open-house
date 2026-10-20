import { useEffect, useState } from 'react';
import { buildCalendar } from '../lib/calendar';
import { content } from '../config/content';

export default function CalendarButton() {
  const [href, setHref] = useState('');
  const [download, setDownload] = useState('open-house.ics');

  useEffect(() => {
    try {
      const cal = buildCalendar();
      setHref(cal.href);
      setDownload(cal.download);
    } catch {
      /* buildCalendar bermasalah di lingkungan tanpa URL.createObjectURL */
    }
  }, []);

  return (
    <a className="button button--secondary" href={href || undefined} download={download}>
      {content.thankyou.nextSteps.addCalendar}
    </a>
  );
}

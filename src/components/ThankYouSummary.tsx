import { useEffect, useState } from 'react';
import { content } from '../config/content';

const STORAGE_SUMMARY_KEY = 'oh_summary';

export default function ThankYouSummary() {
  const [summary, setSummary] = useState<{ child_name: string; attendee_count: number } | null>(
    null,
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_SUMMARY_KEY);
      if (raw) setSummary(JSON.parse(raw) as { child_name: string; attendee_count: number });
    } catch {
      setSummary(null);
    }
  }, []);

  const text = summary
    ? content.thankyou.withSummary
        .replace('{nama anak}', summary.child_name)
        .replace('{jumlah hadir}', String(summary.attendee_count))
    : content.thankyou.withoutSummary;

  return <p className="ty-summary">{text}</p>;
}

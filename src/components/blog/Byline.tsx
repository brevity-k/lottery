import { BYLINE_NAME } from '@/lib/utils/constants';

interface BylineProps {
  date: string;
  lastUpdated?: string;
}

export default function Byline({ date, lastUpdated }: BylineProps) {
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
      <span>By {BYLINE_NAME}</span>
      <span className="text-gray-300">|</span>
      <time dateTime={date}>{formattedDate}</time>
      {lastUpdated && (
        <>
          <span className="text-gray-300">|</span>
          <span>Data verified {new Date(lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </>
      )}
    </div>
  );
}

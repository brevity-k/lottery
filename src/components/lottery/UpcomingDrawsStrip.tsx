import { getActiveLotteries } from '@/lib/lotteries/config';
import { DAY_MAP } from '@/lib/utils/drawSchedule';
import DrawCountdown from './DrawCountdown';
import Link from 'next/link';

function getEarliestDrawDay(drawDays: string[]): number {
  return Math.min(...drawDays.map(d => DAY_MAP[d] ?? 7));
}

export default function UpcomingDrawsStrip() {
  const lotteries = getActiveLotteries()
    .sort((a, b) => getEarliestDrawDay(a.drawDays) - getEarliestDrawDay(b.drawDays));

  return (
    <section className="bg-gradient-to-r from-gray-900 to-gray-800 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-sm font-medium text-gray-400 whitespace-nowrap mb-2">Upcoming Draws</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
          {lotteries.map(lottery => (
            <Link
              key={lottery.slug}
              href={`/${lottery.slug}`}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 rounded-full px-4 py-2 snap-start shrink-0 transition-colors"
            >
              <span className="text-sm font-medium text-white whitespace-nowrap">
                {lottery.name}
              </span>
              <DrawCountdown
                drawDays={lottery.drawDays}
                drawTime={lottery.drawTime}
                retiredDate={lottery.retiredDate}
                colorClass="text-white"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

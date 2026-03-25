import { getAllLotteries } from '@/lib/lotteries/config';
import DrawCountdown from './DrawCountdown';
import Link from 'next/link';

const DAY_ORDER: Record<string, number> = {
  Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4,
  Friday: 5, Saturday: 6, Sunday: 7,
};

function getEarliestDrawDay(drawDays: string[]): number {
  return Math.min(...drawDays.map(d => DAY_ORDER[d] ?? 8));
}

export default function UpcomingDrawsStrip() {
  const lotteries = getAllLotteries()
    .filter(l => !l.retiredDate)
    .sort((a, b) => getEarliestDrawDay(a.drawDays) - getEarliestDrawDay(b.drawDays));

  return (
    <section className="bg-gradient-to-r from-gray-900 to-gray-800 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-sm font-medium text-gray-400 whitespace-nowrap">Upcoming Draws</h2>
        </div>
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
                variant="compact"
                colorClass="text-white"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

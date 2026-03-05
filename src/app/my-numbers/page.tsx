import { Metadata } from 'next';
import { getAllLotteries } from '@/lib/lotteries/config';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import MyNumbersClient from './MyNumbersClient';

export const metadata: Metadata = {
  title: 'My Numbers — Personal Lottery Number Analysis | My Lotto Stats',
  description: 'Save your lottery numbers and see how they would have performed historically. Get what-if analysis, pattern detection, and cross-game comparisons.',
  alternates: {
    canonical: 'https://mylottostats.com/my-numbers',
  },
};

export default function MyNumbersPage() {
  const lotteries = getAllLotteries();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs
        items={[
          { label: 'My Numbers' },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Numbers</h1>
        <p className="text-gray-600">
          Save your lottery numbers and discover how they would have performed historically.
          All data stays in your browser — nothing is sent to any server.
        </p>
      </div>

      <MyNumbersClient lotteries={lotteries} />

      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        <p className="font-medium mb-1">Disclaimer</p>
        <p>
          Historical patterns do not predict future lottery outcomes. Prize amounts shown are estimates
          based on fixed prize tiers; actual payouts may vary. For entertainment and informational purposes only.
          If you or someone you know has a gambling problem, call 1-800-522-4700.
        </p>
      </div>
    </div>
  );
}

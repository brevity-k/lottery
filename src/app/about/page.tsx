import { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/utils/constants';
import { breadcrumbSchema } from '@/lib/seo/structuredData';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { getTotalDrawCount } from '@/lib/data/fetcher';
import { getAllLotteries } from '@/lib/lotteries/config';

export const metadata: Metadata = {
  title: `About ${SITE_NAME} — Free, Transparent Lottery Statistics`,
  description: `${SITE_NAME} provides free, transparent lottery statistics for US lottery players. Learn about our data sources, analysis methodology, and editorial standards.`,
  openGraph: {
    title: `About ${SITE_NAME} — Free, Transparent Lottery Statistics`,
    description: `${SITE_NAME} provides free, transparent lottery statistics for US lottery players. Learn about our data sources, analysis methodology, and editorial standards.`,
    url: `${SITE_URL}/about`,
  },
  alternates: { canonical: `${SITE_URL}/about` },
};

export default function AboutPage() {
  const totalDraws = getTotalDrawCount();
  const gameCount = getAllLotteries().length;

  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'About', url: `${SITE_URL}/about` },
      ])} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: 'About' }]} />

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">About {SITE_NAME}</h1>

        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-lg text-gray-600">
            {SITE_NAME} is a free lottery statistics platform built for US lottery players who want transparent, data-driven analysis — not predictions, not hype. Our mission: make the same historical draw data that anyone can access from public records easy to explore, visualize, and understand.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">Our Approach</h2>
          <p className="text-gray-600">
            {SITE_NAME} is maintained by a team of data analysts and software engineers. We build and maintain a statistical analysis engine that computes frequency distributions, hot and cold number trends, gap analysis, and pair and triplet co-occurrence across complete draw histories. Every metric we publish is calculated from raw draw records — no black boxes, no proprietary scores.
          </p>
          <p className="text-gray-600">
            Full details of the math behind every metric are documented in our{' '}
            <Link href="/methodology" className="text-blue-600 hover:text-blue-800 underline">methodology page</Link>.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">Data &amp; Transparency</h2>
          <p className="text-gray-600">
            All lottery draw data on this site comes from the{' '}
            <a href="https://data.ny.gov" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">New York Open Data portal</a>{' '}
            via the SODA API — a public government data source. We do not manufacture or modify draw records. Our data pipeline fetches the latest results daily and commits them to a version-controlled data store, so every change is auditable.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-4 text-blue-800 font-medium">
            {totalDraws.toLocaleString()} draws analyzed across {gameCount} games &middot; Updated daily
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">What Makes Us Different</h2>
          <ul className="text-gray-600 space-y-2 list-disc list-inside">
            <li><strong>Deep co-occurrence analysis:</strong> pairs, triplets, and quadruplets — not just single-number frequency</li>
            <li>
              <strong>What-If Simulator:</strong> test any combination against the full draw history with the{' '}
              <Link href="/simulator" className="text-blue-600 hover:text-blue-800 underline">number simulator</Link>
            </li>
            <li>
              <strong>Tax calculator:</strong> estimate take-home winnings with the{' '}
              <Link href="/tools/tax-calculator" className="text-blue-600 hover:text-blue-800 underline">lottery tax calculator</Link>{' '}
              covering all 50 states
            </li>
            <li><strong>State-by-state coverage:</strong> lottery rules, tax rates, and claim deadlines for every US state</li>
            <li><strong>No account required:</strong> every statistic and tool is free, forever</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">Editorial Standards</h2>
          <p className="text-gray-600">
            Because lottery information is a sensitive topic, we hold ourselves to strict editorial standards:
          </p>
          <ul className="text-gray-600 space-y-2 list-disc list-inside">
            <li>We never predict outcomes or claim winning strategies — lottery draws are random events and no statistical model can change that</li>
            <li>We cite all data sources and disclose our methodology publicly</li>
            <li>We update data daily and cross-verify accuracy against official lottery sources</li>
            <li>We include responsible gambling resources on every page — if gambling is affecting you or someone you know, contact the National Council on Problem Gambling at 1-800-522-4700</li>
            <li>All analysis is transparent — see our <Link href="/methodology" className="text-blue-600 hover:text-blue-800 underline">methodology page</Link> for the math behind every metric</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">Important Disclaimer</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <p className="text-amber-800">
              {SITE_NAME} is an independent informational platform. We are not affiliated with Powerball, Mega Millions, MUSL, or any state lottery commission. We do not sell lottery tickets or facilitate gambling. Official certified results shall control in any discrepancy — always verify results with your official state lottery. All content is provided for entertainment and educational purposes only. Past draw patterns do not predict or influence future outcomes. Please play responsibly.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

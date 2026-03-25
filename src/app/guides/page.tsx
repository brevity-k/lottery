import { Metadata } from 'next';
import Link from 'next/link';
import { SITE_NAME, SITE_URL } from '@/lib/utils/constants';
import { breadcrumbSchema } from '@/lib/seo/structuredData';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { getAllGuides } from '@/lib/guides';

export const metadata: Metadata = {
  title: `Lottery Guides — How Lotteries Work, Taxes, Odds & More | ${SITE_NAME}`,
  description: `In-depth guides on how lottery odds work, lump sum vs annuity math, state tax rates, common scams, and more. Data-driven, educational, and free.`,
  openGraph: {
    title: 'Lottery Guides — How Lotteries Work, Taxes, Odds & More',
    description: 'In-depth guides on how lottery odds work, lump sum vs annuity math, state tax rates, common scams, and more.',
    url: `${SITE_URL}/guides`,
  },
  alternates: { canonical: `${SITE_URL}/guides` },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function GuidesPage() {
  const guides = getAllGuides();

  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Guides', url: `${SITE_URL}/guides` },
      ])} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: 'Guides' }]} />

        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Lottery Guides</h1>
          <p className="text-lg text-gray-500">
            Deep-dive educational guides on how lotteries work, taxes, odds, scams, and more. Written for accuracy and clarity.
          </p>
        </div>

        {guides.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-500">Guides are coming soon. Check back shortly.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {guides.map((guide) => (
              <Link key={guide.slug} href={`/guides/${guide.slug}`} className="block group">
                <article className="bg-white border border-gray-200 rounded-xl p-5 h-full flex flex-col transition-shadow hover:shadow-md hover:border-gray-300">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-teal-50 text-teal-700 border-teal-200">
                      Guide
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                    {guide.title}
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1 line-clamp-3">{guide.description}</p>
                  <time className="text-xs text-gray-400" dateTime={guide.lastReviewed}>
                    Last reviewed {formatDate(guide.lastReviewed)}
                  </time>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

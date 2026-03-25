import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SITE_URL, DISCLAIMER_TEXT } from '@/lib/utils/constants';
import Byline from '@/components/blog/Byline';
import { breadcrumbSchema } from '@/lib/seo/structuredData';
import JsonLd from '@/components/seo/JsonLd';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { getAllGuides, getGuide } from '@/lib/guides';

export function generateStaticParams() {
  return getAllGuides().map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return {
    title: { absolute: guide.title },
    description: guide.description,
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: `${SITE_URL}/guides/${slug}`,
      type: 'article',
      modifiedTime: guide.lastReviewed,
    },
    alternates: { canonical: `${SITE_URL}/guides/${slug}` },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  return (
    <>
      <JsonLd data={breadcrumbSchema([
        { name: 'Home', url: SITE_URL },
        { name: 'Guides', url: `${SITE_URL}/guides` },
        { name: guide.title, url: `${SITE_URL}/guides/${slug}` },
      ])} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[
          { label: 'Guides', href: '/guides' },
          { label: guide.title },
        ]} />

        <article>
          <header className="mb-8 pb-8 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-teal-50 text-teal-700 border-teal-200">
                Guide
              </span>
              <Byline date={guide.lastReviewed} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 leading-tight">{guide.title}</h1>
            <p className="text-lg text-gray-500 leading-relaxed">{guide.description}</p>
          </header>

          <div
            className="prose prose-gray prose-lg max-w-none
              prose-headings:font-bold prose-headings:text-gray-900
              prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
              prose-p:text-gray-600 prose-p:leading-relaxed
              prose-li:text-gray-600
              prose-strong:text-gray-900
              prose-ul:my-4 prose-ol:my-4"
            dangerouslySetInnerHTML={{ __html: guide.content }}
          />

          <div className="mt-10 bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="text-sm text-amber-800 leading-relaxed">
              <strong>Disclaimer:</strong> {DISCLAIMER_TEXT}
            </p>
          </div>
        </article>

        <nav className="mt-10 pt-8 border-t border-gray-200 flex items-center justify-between">
          <Link href="/guides" className="text-blue-600 hover:underline font-medium">&larr; All Guides</Link>
        </nav>
      </div>
    </>
  );
}

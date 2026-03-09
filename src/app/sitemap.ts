import { MetadataRoute } from 'next';
import { getAllLotteries } from '@/lib/lotteries/config';
import { loadLotteryData } from '@/lib/data/fetcher';
import { getYearsRange } from '@/lib/utils/formatters';
import { getAllBlogPosts } from '@/lib/blog';
import { getAllStateSlugs } from '@/lib/states/config';
import { SITE_URL } from '@/lib/utils/constants';

export const dynamic = 'force-static';

function getDataLastUpdated(slug: string): string {
  try {
    const data = loadLotteryData(slug);
    return data.lastUpdated || new Date().toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export function generateSitemaps() {
  return [
    { id: 'main' },
    { id: 'blog' },
    { id: 'states' },
    { id: 'results' },
  ];
}

export default function sitemap({ id }: { id: string }): MetadataRoute.Sitemap {
  const lotteries = getAllLotteries();
  const currentYear = new Date().getFullYear();

  switch (id) {
    case 'main': {
      const staticPages: MetadataRoute.Sitemap = [
        { url: SITE_URL, changeFrequency: 'daily', priority: 1.0 },
        { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${SITE_URL}/privacy`, changeFrequency: 'monthly', priority: 0.3 },
        { url: `${SITE_URL}/terms`, changeFrequency: 'monthly', priority: 0.3 },
        { url: `${SITE_URL}/disclaimer`, changeFrequency: 'monthly', priority: 0.3 },
        { url: `${SITE_URL}/blog`, changeFrequency: 'daily', priority: 0.7 },
        { url: `${SITE_URL}/tools/number-generator`, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${SITE_URL}/tools/odds-calculator`, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${SITE_URL}/tools/tax-calculator`, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${SITE_URL}/tools/ticket-checker`, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${SITE_URL}/contact`, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${SITE_URL}/states`, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${SITE_URL}/methodology`, changeFrequency: 'monthly', priority: 0.6 },
      ];

      const lotteryPages: MetadataRoute.Sitemap = lotteries.flatMap(lottery => {
        const lastMod = getDataLastUpdated(lottery.slug);
        return [
          { url: `${SITE_URL}/${lottery.slug}`, lastModified: lastMod, changeFrequency: 'daily' as const, priority: 0.9 },
          { url: `${SITE_URL}/${lottery.slug}/numbers`, lastModified: lastMod, changeFrequency: 'daily' as const, priority: 0.8 },
          { url: `${SITE_URL}/${lottery.slug}/results`, lastModified: lastMod, changeFrequency: 'daily' as const, priority: 0.8 },
          { url: `${SITE_URL}/${lottery.slug}/statistics`, lastModified: lastMod, changeFrequency: 'daily' as const, priority: 0.8 },
        ];
      });

      return [...staticPages, ...lotteryPages];
    }

    case 'blog': {
      const blogPosts = getAllBlogPosts();
      return blogPosts.map(post => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.date).toISOString(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
    }

    case 'states': {
      const stateSlugs = getAllStateSlugs();
      return stateSlugs.map(slug => ({
        url: `${SITE_URL}/states/${slug}`,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }));
    }

    case 'results': {
      return lotteries.flatMap(lottery => {
        try {
          const data = loadLotteryData(lottery.slug);
          const years = getYearsRange(data.draws);
          return years.map(year => ({
            url: `${SITE_URL}/${lottery.slug}/results/${year}`,
            lastModified: year === currentYear ? data.lastUpdated : `${year}-12-31T23:59:59.000Z`,
            changeFrequency: year === currentYear ? 'weekly' as const : 'yearly' as const,
            priority: year === currentYear ? 0.7 : 0.4,
          }));
        } catch {
          return [];
        }
      });
    }

    default:
      return [];
  }
}

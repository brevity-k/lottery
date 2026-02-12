import { getAllBlogPosts } from '@/lib/blog';

interface BlogPostSummary {
  slug: string;
  title: string;
  date: string;
  category: string;
}

/**
 * Returns blog posts related to a specific lottery game.
 * Matches by game name or slug appearing in the title or content.
 */
export function getRelatedPosts(gameSlug: string, gameName: string, limit: number = 3): BlogPostSummary[] {
  const allPosts = getAllBlogPosts();
  const searchTerms = [gameSlug.toLowerCase(), gameName.toLowerCase()];

  // Also match generic terms for broader articles
  const genericTerms = ['lottery', 'jackpot', 'tax', 'odds', 'lump sum', 'annuity'];

  const scored = allPosts.map(post => {
    const titleLower = post.title.toLowerCase();
    const contentLower = post.content.toLowerCase();

    let score = 0;

    // Direct game mention in title = highest relevance
    for (const term of searchTerms) {
      if (titleLower.includes(term)) score += 10;
      if (contentLower.includes(term)) score += 3;
    }

    // Generic lottery terms (lower weight)
    for (const term of genericTerms) {
      if (titleLower.includes(term)) score += 1;
    }

    return { post, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => {
      // Sort by score desc, then by date desc
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.post.date).getTime() - new Date(a.post.date).getTime();
    })
    .slice(0, limit)
    .map(s => ({
      slug: s.post.slug,
      title: s.post.title,
      date: s.post.date,
      category: s.post.category,
    }));
}

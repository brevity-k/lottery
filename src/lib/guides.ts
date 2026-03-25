import fs from 'fs';
import path from 'path';

export interface GuidePost {
  slug: string;
  title: string;
  description: string;
  content: string;
  lastReviewed: string;
}

export const GUIDES_DIR = path.join(process.cwd(), 'content', 'guides');

export function getAllGuides(): GuidePost[] {
  try {
    return fs
      .readdirSync(GUIDES_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const raw = fs.readFileSync(path.join(GUIDES_DIR, f), 'utf-8');
        return JSON.parse(raw) as GuidePost;
      })
      .sort((a, b) => b.lastReviewed.localeCompare(a.lastReviewed));
  } catch {
    return [];
  }
}

export function getGuide(slug: string): GuidePost | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  try {
    const raw = fs.readFileSync(path.join(GUIDES_DIR, `${slug}.json`), 'utf-8');
    return JSON.parse(raw) as GuidePost;
  } catch {
    return null;
  }
}

export function getAllGuideSlugs(): string[] {
  try {
    return fs
      .readdirSync(GUIDES_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''));
  } catch {
    return [];
  }
}

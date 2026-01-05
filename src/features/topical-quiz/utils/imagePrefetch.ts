import { Image } from 'expo-image';
import { TopicalQuizContent } from '../types/topicalQuiz.types';

/**
 * Result of prefetch operation.
 */
export interface PrefetchResult {
  /** Number of successfully prefetched images */
  successful: number;
  /** Number of failed prefetches */
  failed: number;
}

/**
 * Extract all valid image URLs from quiz content.
 *
 * @param content - Quiz content with questions
 * @returns Array of image URLs (empty strings and undefined filtered out)
 */
export function extractImageUrls(content: TopicalQuizContent | null | undefined): string[] {
  if (!content?.questions) {
    return [];
  }

  return content.questions
    .map((q) => q.imageUrl)
    .filter((url): url is string => !!url && url.length > 0);
}

/**
 * Prefetch quiz images in parallel.
 *
 * Uses Promise.allSettled to ensure all prefetches are attempted
 * even if some fail.
 *
 * @param urls - Array of image URLs to prefetch
 * @returns PrefetchResult with success/failure counts
 */
export async function prefetchQuizImages(urls: string[]): Promise<PrefetchResult> {
  if (urls.length === 0) {
    return { successful: 0, failed: 0 };
  }

  const results = await Promise.allSettled(
    urls.map((url) => Image.prefetch(url))
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return { successful, failed };
}

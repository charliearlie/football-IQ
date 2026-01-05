import { Image } from 'expo-image';
import { prefetchQuizImages, extractImageUrls } from '../utils/imagePrefetch';

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: {
    prefetch: jest.fn().mockResolvedValue(true),
  },
}));

describe('ImagePrefetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractImageUrls', () => {
    it('extracts all image URLs from quiz content', () => {
      const content = {
        questions: [
          { id: '1', question: 'Q1', imageUrl: 'https://example.com/img1.jpg', options: ['A', 'B', 'C', 'D'], correctIndex: 0 },
          { id: '2', question: 'Q2', imageUrl: 'https://example.com/img2.jpg', options: ['A', 'B', 'C', 'D'], correctIndex: 1 },
          { id: '3', question: 'Q3', imageUrl: undefined, options: ['A', 'B', 'C', 'D'], correctIndex: 2 },
          { id: '4', question: 'Q4', imageUrl: 'https://example.com/img4.jpg', options: ['A', 'B', 'C', 'D'], correctIndex: 3 },
          { id: '5', question: 'Q5', imageUrl: '', options: ['A', 'B', 'C', 'D'], correctIndex: 0 },
        ],
      };

      const urls = extractImageUrls(content);

      expect(urls).toEqual([
        'https://example.com/img1.jpg',
        'https://example.com/img2.jpg',
        'https://example.com/img4.jpg',
      ]);
    });

    it('returns empty array when no images', () => {
      const content = {
        questions: [
          { id: '1', question: 'Q1', options: ['A', 'B', 'C', 'D'], correctIndex: 0 },
          { id: '2', question: 'Q2', options: ['A', 'B', 'C', 'D'], correctIndex: 1 },
          { id: '3', question: 'Q3', options: ['A', 'B', 'C', 'D'], correctIndex: 2 },
          { id: '4', question: 'Q4', options: ['A', 'B', 'C', 'D'], correctIndex: 3 },
          { id: '5', question: 'Q5', options: ['A', 'B', 'C', 'D'], correctIndex: 0 },
        ],
      };

      const urls = extractImageUrls(content);

      expect(urls).toEqual([]);
    });

    it('handles null/undefined content gracefully', () => {
      expect(extractImageUrls(null as any)).toEqual([]);
      expect(extractImageUrls(undefined as any)).toEqual([]);
    });
  });

  describe('prefetchQuizImages', () => {
    it('calls Image.prefetch for all valid URLs', async () => {
      const urls = [
        'https://example.com/img1.jpg',
        'https://example.com/img2.jpg',
        'https://example.com/img3.jpg',
      ];

      const result = await prefetchQuizImages(urls);

      expect(Image.prefetch).toHaveBeenCalledTimes(3);
      expect(Image.prefetch).toHaveBeenCalledWith('https://example.com/img1.jpg');
      expect(Image.prefetch).toHaveBeenCalledWith('https://example.com/img2.jpg');
      expect(Image.prefetch).toHaveBeenCalledWith('https://example.com/img3.jpg');
      expect(result.successful).toBe(3);
      expect(result.failed).toBe(0);
    });

    it('handles failed prefetches gracefully', async () => {
      (Image.prefetch as jest.Mock)
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(true);

      const urls = [
        'https://example.com/img1.jpg',
        'https://example.com/img2.jpg',
        'https://example.com/img3.jpg',
      ];

      const result = await prefetchQuizImages(urls);

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(1);
    });

    it('returns zero counts for empty URL array', async () => {
      const result = await prefetchQuizImages([]);

      expect(Image.prefetch).not.toHaveBeenCalled();
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(0);
    });
  });
});

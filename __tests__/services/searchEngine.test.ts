import { SearchEngine } from '@/services/search/searchEngine';
import { SearchDocument, SearchFilters } from '@/types/search';

const mockDocuments: SearchDocument[] = [
  {
    id: '1',
    title: 'Surah Al-Fatihah Recitation',
    artistOrSpeaker: 'Mishary Alafasy',
    category: 'Quran',
    playlistNames: ['Daily Quran'],
    filename: 'surah fatihah mishary',
    tags: ['quran', 'surah', 'fatihah'],
    mediaType: 'audio',
    sourceUrl: '/audio/fatihah.mp3',
    duration: 42,
    isLocal: true,
    lastPlayed: Date.now(),
    playCount: 10,
    favorite: true,
  },
  {
    id: '2',
    title: 'Arabic Grammar Lesson 01',
    artistOrSpeaker: 'Sheikh Ahmad',
    category: 'Arabic Course',
    playlistNames: ['Arabic Basics'],
    filename: 'arabic grammar 01',
    tags: ['arabic', 'grammar', 'nahw'],
    mediaType: 'video',
    sourceUrl: '/video/arabic01.mp4',
    duration: 1800,
    isLocal: false,
    lastPlayed: null,
    playCount: 2,
    favorite: false,
  },
  {
    id: '3',
    title: 'Tafsir Surah Baqarah',
    artistOrSpeaker: 'Dr. Israr',
    category: 'Tafsir',
    playlistNames: ['Tafsir Series'],
    filename: 'tafsir baqarah',
    tags: ['tafsir', 'quran', 'baqarah'],
    mediaType: 'audio',
    sourceUrl: '/audio/tafsir.mp3',
    duration: 3600,
    isLocal: true,
    lastPlayed: Date.now() - 86400000,
    playCount: 5,
    favorite: true,
  },
];

const baseFilters: SearchFilters = {
  mediaType: 'all',
  category: '',
  isLocal: null,
  isFavorite: null,
  minDuration: 0,
  maxDuration: 0,
  sortBy: 'relevance',
};

describe('SearchEngine', () => {
  describe('search', () => {
    it('should find results by title', () => {
      const results = SearchEngine.search('Arabic', mockDocuments);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].document.title).toContain('Arabic');
    });

    it('should find results by tags', () => {
      const results = SearchEngine.search('tafsir', mockDocuments);
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.document.id === '3')).toBe(true);
    });

    it('should find results by artist', () => {
      const results = SearchEngine.search('Mishary', mockDocuments);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].document.id).toBe('1');
    });

    it('should return empty for no match', () => {
      const results = SearchEngine.search('xyznonexistent', mockDocuments);
      expect(results).toHaveLength(0);
    });

    it('should return empty for empty query', () => {
      const results = SearchEngine.search('', mockDocuments);
      expect(results).toHaveLength(0);
    });

    it('should rank title+tag matches above single-field matches', () => {
      const results = SearchEngine.search('Surah', mockDocuments);
      // Doc 1 matches title, filename AND tags; doc 3 matches title only
      expect(results[0].document.id).toBe('1');
    });
  });

  describe('filters', () => {
    it('should return empty when query is empty regardless of filters', () => {
      const results = SearchEngine.search('', mockDocuments, {
        ...baseFilters,
        mediaType: 'video',
      });
      expect(results).toHaveLength(0);
    });

    it('should filter favorites with query', () => {
      const results = SearchEngine.search('surah', mockDocuments, {
        ...baseFilters,
        isFavorite: true,
      });
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((r) => r.document.favorite)).toBe(true);
    });

    it('should filter by media type with query', () => {
      const results = SearchEngine.search('arabic', mockDocuments, {
        ...baseFilters,
        mediaType: 'video',
      });
      expect(results.every((r) => r.document.mediaType === 'video')).toBe(true);
    });
  });

  describe('suggestions', () => {
    it('should return title suggestions', () => {
      const suggestions = SearchEngine.getSuggestions('ara', mockDocuments);
      expect(suggestions.some((s) => s.includes('Arabic'))).toBe(true);
    });

    it('should return tag suggestions', () => {
      const suggestions = SearchEngine.getSuggestions('qur', mockDocuments);
      expect(suggestions.some((s) => s.includes('quran'))).toBe(true);
    });

    it('should limit suggestions', () => {
      const suggestions = SearchEngine.getSuggestions('a', mockDocuments, 2);
      expect(suggestions.length).toBeLessThanOrEqual(2);
    });
  });

  describe('auto-tagging', () => {
    it('should detect Quran tags', () => {
      const tags = SearchEngine.extractTags(
        'Surah Al-Baqarah Recitation',
        'surah baqarah',
        '/quran/'
      );
      expect(tags).toContain('quran');
      expect(tags).toContain('surah al');
    });

    it('should detect Arabic tags', () => {
      const tags = SearchEngine.extractTags(
        'Arabic Grammar Basics',
        'arabic nahw',
        '/arabic/'
      );
      expect(tags).toContain('arabic');
    });

    it('should detect category', () => {
      expect(SearchEngine.detectCategory('Tafsir Ibn Kathir', '/tafsir/', ['tafsir'])).toBe(
        'Tafsir'
      );
      expect(SearchEngine.detectCategory('Lesson', '/arabic/', ['arabic'])).toBe('Arabic Course');
    });
  });
});

import {
  DEFAULT_SEARCH_FILTERS,
  SEARCH_CONFIG,
  SearchDocument,
  SearchFilters,
  SearchResult,
} from '@/types/search';
import { LocalMediaItem } from '@/types/library';
import { Playlist } from '@/types/playlist';

// ─── Index Builder ───────────────────────────────────
export const SearchEngine = {
  /**
   * Build searchable documents from library media and playlists
   */
  buildIndex(mediaItems: LocalMediaItem[], playlists: Playlist[]): SearchDocument[] {
    const playlistMap = new Map<string, string[]>();

    // Map media IDs to their playlist names
    playlists.forEach((pl) => {
      pl.mediaIds.forEach((mediaId) => {
        const existing = playlistMap.get(mediaId) || [];
        existing.push(pl.name);
        playlistMap.set(mediaId, existing);
      });
    });

    return mediaItems.map((item) => {
      const filename =
        item.filePath
          .split('/')
          .pop()
          ?.replace(/\.[^/.]+$/, '')
          .replace(/[_-]/g, ' ') || '';

      // Auto-generate tags from title and path
      const autoTags = this.extractTags(item.title, filename, item.filePath);

      return {
        id: item.id,
        title: item.title,
        artistOrSpeaker: '', // Can be enriched later
        category: this.detectCategory(item.title, item.filePath, autoTags),
        playlistNames: playlistMap.get(item.id) || [],
        filename,
        tags: autoTags,
        mediaType: item.mediaType,
        sourceUrl: item.filePath,
        thumbnailUrl: item.thumbnail,
        duration: item.duration,
        isLocal: true,
        lastPlayed: item.lastPlayed,
        playCount: item.playCount,
        favorite: item.favorite,
      };
    });
  },

  /**
   * Extract tags from text using common patterns
   */
  extractTags(title: string, filename: string, filePath: string): string[] {
    const tags = new Set<string>();
    const combined = `${title} ${filename} ${filePath}`.toLowerCase().replace(/[_-]+/g, ' ');

    // Quran surah detection
    const surahPattern = /surah?\s*(\w+)/gi;
    let match;
    while ((match = surahPattern.exec(combined)) !== null) {
      tags.add(`surah ${match[1]}`);
      tags.add('quran');
    }

    // Common Islamic content tags
    const keywordMap: Record<string, string[]> = {
      quran: ['quran', 'tilawat', 'recitation'],
      tafsir: ['tafsir', 'tafseer', 'exegesis'],
      hadith: ['hadith', 'hadees', 'bukhari', 'muslim'],
      lecture: ['lecture', 'bayan', 'dars', 'talk', 'speech'],
      nasheed: ['nasheed', 'nasheeed', 'song', 'poem'],
      arabic: ['arabic', 'arabi', 'nahw', 'sarf', 'grammar'],
      fiqh: ['fiqh', 'jurisprudence', 'masail', 'ruling'],
      seerah: ['seerah', 'sirah', 'prophet', 'rasul'],
      dua: ['dua', 'supplication', 'azkar', 'dhikr'],
      ramadan: ['ramadan', 'ramzan', 'iftar', 'taraweeh'],
    };

    Object.entries(keywordMap).forEach(([tag, keywords]) => {
      if (keywords.some((kw) => combined.includes(kw))) {
        tags.add(tag);
      }
    });

    return Array.from(tags);
  },

  /**
   * Auto-detect content category
   */
  detectCategory(title: string, filePath: string, tags: string[]): string {
    const combined = `${title} ${filePath} ${tags.join(' ')}`.toLowerCase();

    if (combined.includes('tafsir') || combined.includes('tafseer')) return 'Tafsir';
    if (combined.includes('arabic') || combined.includes('nahw')) return 'Arabic Course';
    if (combined.includes('quran') || combined.includes('surah')) return 'Quran';
    if (combined.includes('hadith') || combined.includes('bukhari')) return 'Hadith';
    if (combined.includes('lecture') || combined.includes('bayan')) return 'Lectures';
    if (combined.includes('nasheed')) return 'Nasheed';
    if (combined.includes('fiqh')) return 'Fiqh';
    if (combined.includes('seerah') || combined.includes('sirah')) return 'Seerah';
    if (combined.includes('dua') || combined.includes('azkar')) return 'Dua & Azkar';

    return 'General';
  },

  /**
   * Perform fuzzy search across all fields
   */
  search(
    query: string,
    documents: SearchDocument[],
    filters: SearchFilters = DEFAULT_SEARCH_FILTERS
  ): SearchResult[] {
    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
      return [];
    }

    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const results: SearchResult[] = [];

    for (const doc of documents) {
      // Apply filters first
      if (!this.matchesFilters(doc, filters)) continue;

      let totalScore = 0;
      const matchedFields: string[] = [];

      // Score each field
      const fieldScores = this.scoreDocument(doc, queryTokens, normalizedQuery);

      for (const [field, score] of Object.entries(fieldScores)) {
        if (score > 0) {
          const weight =
            SEARCH_CONFIG.FIELD_WEIGHTS[field as keyof typeof SEARCH_CONFIG.FIELD_WEIGHTS] || 1;
          totalScore += score * weight;
          matchedFields.push(field);
        }
      }

      if (totalScore > 0) {
        // Normalize score to 0-1
        const maxPossible = Object.values(SEARCH_CONFIG.FIELD_WEIGHTS).reduce((a, b) => a + b, 0);
        const normalizedScore = Math.min(totalScore / maxPossible, 1);

        results.push({
          document: doc,
          score: normalizedScore,
          matchedFields,
          highlightTitle: this.highlightMatch(doc.title, queryTokens),
        });
      }
    }

    // Sort by score and apply sort preference
    return this.sortResults(results, filters.sortBy).slice(0, SEARCH_CONFIG.MAX_RESULTS);
  },

  /**
   * Score a document against query tokens
   */
  scoreDocument(
    doc: SearchDocument,
    tokens: string[],
    fullQuery: string
  ): Record<string, number> {
    const scores: Record<string, number> = {};

    const fields: Record<string, string> = {
      title: doc.title.toLowerCase(),
      artistOrSpeaker: doc.artistOrSpeaker.toLowerCase(),
      category: doc.category.toLowerCase(),
      playlistNames: doc.playlistNames.join(' ').toLowerCase(),
      filename: doc.filename.toLowerCase(),
      tags: doc.tags.join(' ').toLowerCase(),
    };

    for (const [fieldName, fieldValue] of Object.entries(fields)) {
      let fieldScore = 0;

      // Exact full query match (highest score)
      if (fieldValue.includes(fullQuery)) {
        fieldScore += 1.0;
      }

      // Token matching
      for (const token of tokens) {
        if (fieldValue.includes(token)) {
          fieldScore += 0.5;

          // Starts-with bonus
          if (fieldValue.startsWith(token)) {
            fieldScore += 0.3;
          }

          // Word boundary bonus
          const wordBoundaryRegex = new RegExp(`\\b${this.escapeRegex(token)}`, 'i');
          if (wordBoundaryRegex.test(fieldValue)) {
            fieldScore += 0.2;
          }
        }
      }

      scores[fieldName] = Math.min(fieldScore, 1.0);
    }

    return scores;
  },

  /**
   * Check if document matches active filters
   */
  matchesFilters(doc: SearchDocument, filters: SearchFilters): boolean {
    if (filters.mediaType !== 'all' && doc.mediaType !== filters.mediaType) {
      return false;
    }
    if (filters.category && doc.category.toLowerCase() !== filters.category.toLowerCase()) {
      return false;
    }
    if (filters.isLocal !== null && doc.isLocal !== filters.isLocal) {
      return false;
    }
    if (filters.isFavorite !== null && doc.favorite !== filters.isFavorite) {
      return false;
    }
    if (filters.minDuration > 0 && doc.duration < filters.minDuration) {
      return false;
    }
    if (filters.maxDuration > 0 && doc.duration > filters.maxDuration) {
      return false;
    }
    return true;
  },

  /**
   * Sort results by preference
   */
  sortResults(results: SearchResult[], sortBy: SearchFilters['sortBy']): SearchResult[] {
    const sorted = [...results];

    switch (sortBy) {
      case 'relevance':
        sorted.sort((a, b) => b.score - a.score);
        break;
      case 'title':
        sorted.sort((a, b) => a.document.title.localeCompare(b.document.title));
        break;
      case 'recent':
        sorted.sort((a, b) => (b.document.lastPlayed || 0) - (a.document.lastPlayed || 0));
        break;
      case 'duration':
        sorted.sort((a, b) => a.document.duration - b.document.duration);
        break;
      case 'popular':
        sorted.sort((a, b) => b.document.playCount - a.document.playCount);
        break;
    }

    return sorted;
  },

  /**
   * Highlight matching text in title
   */
  highlightMatch(title: string, tokens: string[]): string {
    let highlighted = title;
    for (const token of tokens) {
      const regex = new RegExp(`(${this.escapeRegex(token)})`, 'gi');
      highlighted = highlighted.replace(regex, '★$1★');
    }
    return highlighted;
  },

  /**
   * Get unique categories from documents
   */
  getCategories(documents: SearchDocument[]): string[] {
    const categories = new Set(documents.map((d) => d.category));
    return Array.from(categories).sort();
  },

  /**
   * Get search suggestions based on partial query
   */
  getSuggestions(query: string, documents: SearchDocument[], maxSuggestions = 8): string[] {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 1) return [];

    const suggestions = new Set<string>();

    for (const doc of documents) {
      // Title suggestions
      if (doc.title.toLowerCase().includes(normalized)) {
        suggestions.add(doc.title);
      }
      // Tag suggestions
      for (const tag of doc.tags) {
        if (tag.toLowerCase().includes(normalized)) {
          suggestions.add(tag);
        }
      }
      // Category suggestions
      if (doc.category.toLowerCase().includes(normalized)) {
        suggestions.add(doc.category);
      }
    }

    return Array.from(suggestions).slice(0, maxSuggestions);
  },

  escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },
};

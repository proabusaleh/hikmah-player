import { useRouter } from 'expo-router';
import {
  ArrowRight,
  Clock,
  Film,
  Heart,
  Music,
  Search as SearchIcon,
  Trash2,
  X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { BottomSheet } from '@/components/common/BottomSheet';
import { HikmahButton } from '@/components/common/HikmahButton';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { SmartSearchBar } from '@/components/search/SmartSearchBar';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useSearchStore } from '@/store/useSearchStore';
import { MediaItem } from '@/types/media';
import { SearchResult } from '@/types/search';

export default function SearchScreen() {
  const router = useRouter();
  const { playMedia, setQueue } = useAudioPlayback();

  const {
    query,
    debouncedQuery,
    categoryGroups,
    totalResults,
    isSearching,
    searchHistory,
    suggestions,
    filters,
    availableCategories,
    buildSearchIndex,
    isIndexReady,
    loadHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    setQuery,
    setDebouncedQuery,
    setFilters,
    resetFilters,
  } = useSearchStore();

  const [showFilters, setShowFilters] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>('all');

  useEffect(() => {
    if (!isIndexReady) {
      buildSearchIndex();
    }
    void loadHistory();
  }, [buildSearchIndex, isIndexReady, loadHistory]);

  const handleResultPress = (result: SearchResult) => {
    const doc = result.document;

    // Save to history
    void addToHistory(query, totalResults);

    if (doc.mediaType === 'video') {
      router.push({
        pathname: '/player/video',
        params: {
          id: doc.id,
          title: doc.title,
          speaker: doc.artistOrSpeaker,
          url: doc.sourceUrl,
        },
      });
    } else {
      const mediaItem: MediaItem = {
        id: doc.id,
        title: doc.title,
        artistOrSpeaker: doc.artistOrSpeaker || undefined,
        url: doc.sourceUrl,
        duration: doc.duration,
        type: doc.mediaType,
        addedAt: Date.now(),
        thumbnailUrl: doc.thumbnailUrl,
      };
      setQueue([mediaItem], 0);
      playMedia(mediaItem);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    setQuery(suggestion);
    setDebouncedQuery(suggestion);
  };

  const handleHistoryPress = (historyQuery: string) => {
    setQuery(historyQuery);
    setDebouncedQuery(historyQuery);
  };

  // Active group results
  const activeGroupData =
    categoryGroups.find((g) => g.category === activeGroup) || categoryGroups[0];

  const showEmptyState = debouncedQuery.length > 0 && !isSearching && totalResults === 0;
  const showHistory = query.length === 0 && searchHistory.length > 0;
  const showSuggestions = query.length > 0 && suggestions.length > 0 && totalResults === 0;

  return (
    <View style={styles.container}>
      {/* ── Search Bar ── */}
      <View style={styles.searchBarContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
        <View style={styles.searchBarWrap}>
          <SmartSearchBar autoFocus onFilterPress={() => setShowFilters(true)} />
        </View>
      </View>

      {/* ── Category Tabs (when results exist) ── */}
      {totalResults > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabsContent}
        >
          {categoryGroups
            .filter((g) => g.totalCount > 0)
            .map((group) => {
              const isActive = activeGroup === group.category;
              const Icon =
                group.category === 'videos'
                  ? Film
                  : group.category === 'audio'
                    ? Music
                    : group.category === 'favorites'
                      ? Heart
                      : SearchIcon;

              return (
                <TouchableOpacity
                  key={group.category}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setActiveGroup(group.category)}
                  activeOpacity={0.7}
                >
                  <Icon size={14} color={isActive ? Colors.background : Colors.muted} />
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {group.label}
                  </Text>
                  <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                    <Text
                      style={[styles.tabCountText, isActive && styles.tabCountTextActive]}
                    >
                      {group.totalCount}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      )}

      {/* ── Search Results ── */}
      {totalResults > 0 && activeGroupData && (
        <FlatList
          data={activeGroupData.results}
          keyExtractor={(item) => item.document.id}
          contentContainerStyle={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <SearchResultCard
              result={item}
              query={debouncedQuery}
              onPress={() => handleResultPress(item)}
            />
          )}
        />
      )}

      {/* ── Empty State ── */}
      {showEmptyState && (
        <View style={styles.centerState}>
          <SearchIcon size={48} color={Colors.dim} />
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptySubtitle}>
            Try searching with different keywords or adjust filters
          </Text>
          <HikmahButton title="Clear Filters" onPress={resetFilters} variant="outline" size="sm" />
        </View>
      )}

      {/* ── Suggestions ── */}
      {showSuggestions && (
        <ScrollView style={styles.suggestionsContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>Suggestions</Text>
          {suggestions.map((suggestion, i) => (
            <TouchableOpacity
              key={`${suggestion}-${i}`}
              style={styles.suggestionRow}
              onPress={() => handleSuggestionPress(suggestion)}
              activeOpacity={0.7}
            >
              <SearchIcon size={16} color={Colors.dim} />
              <Text style={styles.suggestionText}>{suggestion}</Text>
              <ArrowRight size={14} color={Colors.dim} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Search History ── */}
      {showHistory && (
        <ScrollView style={styles.historyContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.historyHeader}>
            <Text style={styles.sectionLabel}>Recent Searches</Text>
            <TouchableOpacity onPress={() => void clearHistory()} style={styles.clearHistoryBtn}>
              <Trash2 size={14} color={Colors.dim} />
              <Text style={styles.clearHistoryText}>Clear</Text>
            </TouchableOpacity>
          </View>
          {searchHistory.map((item, i) => (
            <TouchableOpacity
              key={`${item.query}-${i}`}
              style={styles.historyRow}
              onPress={() => handleHistoryPress(item.query)}
              activeOpacity={0.7}
            >
              <Clock size={16} color={Colors.dim} />
              <View style={styles.historyInfo}>
                <Text style={styles.historyQuery}>{item.query}</Text>
                <Text style={styles.historyMeta}>
                  {item.resultCount} results • {new Date(item.timestamp).toLocaleDateString()}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => void removeFromHistory(item.query)}
                style={styles.removeHistoryBtn}
              >
                <X size={14} color={Colors.dim} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Filters Bottom Sheet ── */}
      <BottomSheet visible={showFilters} title="Search Filters" onClose={() => setShowFilters(false)} height={560}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Media Type */}
          <Text style={styles.filterLabel}>Media Type</Text>
          <View style={styles.filterChips}>
            {(['all', 'audio', 'video'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.filterChip, filters.mediaType === type && styles.filterChipActive]}
                onPress={() => setFilters({ mediaType: type })}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filters.mediaType === type && styles.filterChipTextActive,
                  ]}
                >
                  {type === 'all' ? 'All' : type === 'audio' ? '🎵 Audio' : '🎬 Video'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Category */}
          <Text style={[styles.filterLabel, { marginTop: Spacing.xl }]}>Category</Text>
          <View style={styles.filterChips}>
            <TouchableOpacity
              style={[styles.filterChip, filters.category === '' && styles.filterChipActive]}
              onPress={() => setFilters({ category: '' })}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filters.category === '' && styles.filterChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {availableCategories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, filters.category === cat && styles.filterChipActive]}
                onPress={() => setFilters({ category: cat })}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filters.category === cat && styles.filterChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Favorites Only */}
          <Text style={[styles.filterLabel, { marginTop: Spacing.xl }]}>Favorites Only</Text>
          <View style={styles.filterChips}>
            {([null, true] as const).map((val) => (
              <TouchableOpacity
                key={String(val)}
                style={[styles.filterChip, filters.isFavorite === val && styles.filterChipActive]}
                onPress={() => setFilters({ isFavorite: val })}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filters.isFavorite === val && styles.filterChipTextActive,
                  ]}
                >
                  {val ? '❤️ Favorites' : 'All'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sort By */}
          <Text style={[styles.filterLabel, { marginTop: Spacing.xl }]}>Sort By</Text>
          <View style={styles.filterChips}>
            {(['relevance', 'title', 'recent', 'popular'] as const).map((sort) => (
              <TouchableOpacity
                key={sort}
                style={[styles.filterChip, filters.sortBy === sort && styles.filterChipActive]}
                onPress={() => setFilters({ sortBy: sort })}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filters.sortBy === sort && styles.filterChipTextActive,
                  ]}
                >
                  {sort.charAt(0).toUpperCase() + sort.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.filterActions}>
            <HikmahButton
              title="Reset All"
              onPress={() => {
                resetFilters();
                setShowFilters(false);
              }}
              variant="ghost"
              size="md"
            />
            <HikmahButton
              title="Apply Filters"
              onPress={() => setShowFilters(false)}
              variant="primary"
              size="md"
            />
          </View>

          <View style={{ height: Spacing.xxxl }} />
        </ScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: {
    padding: Spacing.sm,
  },
  backText: {
    fontSize: 15,
    color: Colors.secondary,
    fontWeight: '600',
  },
  searchBarWrap: {
    flex: 1,
  },
  // Tabs
  tabsScroll: {
    maxHeight: 48,
  },
  tabsContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.muted,
  },
  tabTextActive: {
    color: Colors.background,
  },
  tabCount: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabCountActive: {
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  tabCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.muted,
  },
  tabCountTextActive: {
    color: Colors.background,
  },
  // Results
  resultsList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  // Empty
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xxxl,
  },
  emptyTitle: {
    ...Typography.h3,
  },
  emptySubtitle: {
    ...Typography.body,
    textAlign: 'center',
    color: Colors.dim,
  },
  // Suggestions
  suggestionsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  sectionLabel: {
    ...Typography.label,
    marginBottom: Spacing.md,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  suggestionText: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
  },
  // History
  historyContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  clearHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearHistoryText: {
    fontSize: 13,
    color: Colors.dim,
    fontWeight: '600',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyInfo: {
    flex: 1,
  },
  historyQuery: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
  },
  historyMeta: {
    ...Typography.caption,
    marginTop: 2,
  },
  removeHistoryBtn: {
    padding: Spacing.sm,
  },
  // Filters
  filterLabel: {
    ...Typography.h4,
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  filterChipTextActive: {
    color: Colors.background,
  },
  filterActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xxl,
  },
});

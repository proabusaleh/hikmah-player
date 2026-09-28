import { Eye, Film, Music } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ContinueWatchingCard } from '@/components/cards/ContinueWatchingCard';
import { SectionHeader } from '@/components/common/SectionHeader';
import { Colors, Spacing } from '@/constants/theme';
import { useContinueWatchingStore } from '@/store/useContinueWatchingStore';
import { ContinueWatchingFilter, PlaybackProgress } from '@/types/progress';

interface ContinueWatchingSectionProps {
  variant?: 'horizontal' | 'list';
  maxItems?: number;
  onItemPress?: (item: PlaybackProgress) => void;
}

const FILTERS: { key: ContinueWatchingFilter; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: <Eye size={14} /> },
  { key: 'video', label: 'Videos', icon: <Film size={14} /> },
  { key: 'audio', label: 'Audio', icon: <Music size={14} /> },
];

export const ContinueWatchingSection: React.FC<ContinueWatchingSectionProps> = ({
  variant = 'horizontal',
  maxItems = 10,
  onItemPress,
}) => {
  const {
    continueWatchingItems,
    filter,
    loadProgress,
    setFilter,
    getFilteredItems,
    clearProgress,
    clearAllProgress,
  } = useContinueWatchingStore();

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  const filteredItems = getFilteredItems().slice(0, maxItems);

  if (continueWatchingItems.length === 0) {
    return null;
  }

  const handlePress = (item: PlaybackProgress) => {
    onItemPress?.(item);
  };

  const handleClearAll = () => {
    Alert.alert('Clear History', 'Remove all continue watching progress?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: () => void clearAllProgress() },
    ]);
  };

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Continue Watching"
        subtitle={`${continueWatchingItems.length} items`}
        actionLabel="Clear"
        onAction={handleClearAll}
      />

      {continueWatchingItems.length > 3 && (
        <View style={styles.filterRow}>
          {FILTERS.map((entry) => {
            const isActive = filter === entry.key;
            return (
              <TouchableOpacity
                key={entry.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setFilter(entry.key)}
                activeOpacity={0.7}
              >
                {entry.icon}
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>{entry.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {variant === 'horizontal' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
          {filteredItems.map((item) => (
            <ContinueWatchingCard
              key={item.mediaId}
              item={item}
              variant="compact"
              onPress={() => handlePress(item)}
              onDismiss={() => void clearProgress(item.mediaId)}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.listContainer}>
          {filteredItems.map((item) => (
            <ContinueWatchingCard
              key={item.mediaId}
              item={item}
              variant="horizontal"
              onPress={() => handlePress(item)}
              onDismiss={() => void clearProgress(item.mediaId)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xxl,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.muted,
  },
  filterTextActive: {
    color: Colors.background,
  },
  horizontalScroll: {
    paddingRight: Spacing.lg,
  },
  listContainer: {
    gap: 0,
  },
});

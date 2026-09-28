import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { LocalMediaItem } from '@/types/library';

import { OptimizedMediaCard } from './OptimizedMediaCard';

interface OptimizedMediaListProps {
  data: LocalMediaItem[];
  onPlay: (item: LocalMediaItem, index: number) => void;
  onFavorite?: (id: string) => void;
  onDownload?: (item: LocalMediaItem) => void;
  onLongPress?: (item: LocalMediaItem) => void;
  currentPlayingId?: string | null;
  variant?: 'list' | 'grid';
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
}

// ─── Key Extractor (stable, fast) ────────────────────
const keyExtractor = (item: LocalMediaItem) => item.id;

// ─── Item Separator ──────────────────────────────────
const ItemSeparator = () => <View style={styles.separator} />;

export const OptimizedMediaList: React.FC<OptimizedMediaListProps> = React.memo(
  ({
    data,
    onPlay,
    onFavorite,
    onDownload,
    onLongPress,
    currentPlayingId,
    variant = 'list',
    ListHeaderComponent,
    ListEmptyComponent,
  }) => {
    const isGrid = variant === 'grid';
    const numColumns = isGrid ? 2 : 1;

    // Stable callback references
    const handlePlay = useCallback(
      (item: LocalMediaItem, index: number) => {
        onPlay(item, index);
      },
      [onPlay]
    );

    const handleFavorite = useCallback(
      (id: string) => {
        onFavorite?.(id);
      },
      [onFavorite]
    );

    const handleDownload = useCallback(
      (item: LocalMediaItem) => {
        onDownload?.(item);
      },
      [onDownload]
    );

    const handleLongPress = useCallback(
      (item: LocalMediaItem) => {
        onLongPress?.(item);
      },
      [onLongPress]
    );

    // Optimized render item
    const renderItem = useCallback(
      ({ item, index }: ListRenderItemInfo<LocalMediaItem>) => (
        <OptimizedMediaCard
          item={item}
          index={index}
          isPlaying={item.id === currentPlayingId}
          isGrid={isGrid}
          onPlay={handlePlay}
          onFavorite={handleFavorite}
          onDownload={handleDownload}
          onLongPress={handleLongPress}
        />
      ),
      [currentPlayingId, isGrid, handlePlay, handleFavorite, handleDownload, handleLongPress]
    );

    return (
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        drawDistance={200}
        extraData={currentPlayingId}
        ItemSeparatorComponent={!isGrid ? ItemSeparator : undefined}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  }
);

OptimizedMediaList.displayName = 'OptimizedMediaList';

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  separator: {
    height: Spacing.sm,
  },
});

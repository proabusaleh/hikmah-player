import { Clock, ListMusic, Play, Sparkles, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BottomSheet } from '@/components/common/BottomSheet';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useSmartPlayback } from '@/hooks/useSmartPlayback';
import { SmartQueueItem } from '@/types/smartPlayback';
import { formatTime } from '@/utils/formatters';

interface SmartQueueSheetProps {
  visible: boolean;
  onClose: () => void;
  onPlayItem: (item: SmartQueueItem) => void;
}

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  queue: <ListMusic size={14} color={Colors.muted} />,
  history: <Clock size={14} color={Colors.info} />,
  similar: <Sparkles size={14} color={Colors.accent} />,
  trending: <TrendingUp size={14} color={Colors.warning} />,
  playlist: <ListMusic size={14} color={Colors.secondary} />,
};

export const SmartQueueSheet: React.FC<SmartQueueSheetProps> = ({
  visible,
  onClose,
  onPlayItem,
}) => {
  const { smartQueue, isSmartQueueActive } = useSmartPlayback();

  return (
    <BottomSheet visible={visible} title="Smart Queue" onClose={onClose} height={520}>
      {!isSmartQueueActive || smartQueue.length === 0 ? (
        <View style={styles.emptyState}>
          <Sparkles size={40} color={Colors.dim} />
          <Text style={styles.emptyTitle}>Smart Queue is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Play something to get personalized recommendations
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.headerInfo}>
            <Sparkles size={16} color={Colors.accent} />
            <Text style={styles.headerText}>
              {smartQueue.length} recommendations based on your listening
            </Text>
          </View>

          <FlatList
            data={smartQueue}
            keyExtractor={(item) => item.media.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.queueItem}
                onPress={() => onPlayItem(item)}
                activeOpacity={0.7}
              >
                {/* Position */}
                <Text style={styles.position}>{item.position}</Text>

                {/* Info */}
                <View style={styles.itemInfo}>
                  <Text numberOfLines={1} style={styles.itemTitle}>
                    {item.media.title}
                  </Text>
                  <View style={styles.itemMeta}>
                    {SOURCE_ICONS[item.source]}
                    <Text style={styles.itemReason}>{item.reason}</Text>
                    <Text style={styles.itemDuration}>{formatTime(item.media.duration)}</Text>
                  </View>
                </View>

                {/* Score */}
                <View style={styles.scoreContainer}>
                  <View style={[styles.scoreBar, { width: Math.round(item.score * 40) }]} />
                  <Text style={styles.scoreText}>{Math.round(item.score * 100)}%</Text>
                </View>

                {/* Play */}
                <View style={styles.playIcon}>
                  <Play size={16} color={Colors.secondary} fill={Colors.secondary} />
                </View>
              </TouchableOpacity>
            )}
          />
        </>
      )}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h3,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.dim,
    textAlign: 'center',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    backgroundColor: 'rgba(52, 211, 153, 0.06)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  headerText: {
    flex: 1,
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '500',
  },
  list: {
    maxHeight: 380,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  position: {
    width: 24,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.dim,
    textAlign: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    ...Typography.h4,
    fontSize: 14,
    marginBottom: 3,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemReason: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: '500',
  },
  itemDuration: {
    fontSize: 11,
    color: Colors.dim,
    marginLeft: 'auto',
    fontVariant: ['tabular-nums'],
  },
  scoreContainer: {
    alignItems: 'center',
    gap: 2,
  },
  scoreBar: {
    height: 3,
    backgroundColor: Colors.accent,
    borderRadius: 2,
    minWidth: 4,
  },
  scoreText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.dim,
  },
  playIcon: {
    padding: Spacing.sm,
  },
});

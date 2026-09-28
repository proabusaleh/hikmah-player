import { Clock, Film, Music, Play, X } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { PlaybackProgress } from '@/types/progress';
import { formatTime } from '@/utils/formatters';

interface ContinueWatchingCardProps {
  item: PlaybackProgress;
  onPress: () => void;
  onDismiss?: () => void;
  variant?: 'horizontal' | 'compact';
}

export const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({
  item,
  onPress,
  onDismiss,
  variant = 'horizontal',
}) => {
  const isVideo = item.mediaType === 'video';
  const isCompact = variant === 'compact';
  const progressWidth = `${Math.min(item.progressPercent, 100)}%` as const;
  const progressColor =
    item.progressPercent < 30 ? Colors.secondary : item.progressPercent < 70 ? Colors.accent : Colors.warning;

  return (
    <TouchableOpacity
      style={[styles.container, isCompact ? styles.compact : styles.horizontal]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.thumbnail, isCompact ? styles.thumbCompact : styles.thumbHorizontal]}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbImage} />
        ) : (
          <View style={styles.thumbFallback}>
            {isVideo ? <Film size={isCompact ? 18 : 24} color={Colors.info} /> : <Music size={isCompact ? 18 : 24} color={Colors.secondary} />}
          </View>
        )}

        <View style={styles.playOverlay}>
          <View style={styles.playCircle}>
            <Play size={isCompact ? 12 : 16} color={Colors.white} fill={Colors.white} style={{ marginLeft: 1 }} />
          </View>
        </View>

        <View style={styles.typeBadge}>
          {isVideo ? <Film size={10} color={Colors.white} /> : <Music size={10} color={Colors.white} />}
        </View>
      </View>

      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.title}>
          {item.title}
        </Text>

        {item.speakerOrArtist && (
          <Text numberOfLines={1} style={styles.speaker}>
            {item.speakerOrArtist}
          </Text>
        )}

        <View style={styles.timeRow}>
          <Clock size={10} color={Colors.dim} />
          <Text style={styles.timeText}>
            {formatTime(item.position)} / {formatTime(item.duration)}
          </Text>
          <Text style={[styles.percentText, { color: progressColor }]}>{item.progressPercent}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressWidth, backgroundColor: progressColor }]} />
        </View>
      </View>

      {onDismiss && (
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={(event) => {
            event.stopPropagation();
            onDismiss();
          }}
          activeOpacity={0.6}
        >
          <X size={14} color={Colors.dim} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  horizontal: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  compact: {
    flexDirection: 'row',
    width: 220,
    marginRight: Spacing.md,
  },
  thumbnail: {
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  thumbHorizontal: {
    width: 120,
    height: 75,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  thumbCompact: {
    width: 70,
    height: 70,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: Colors.overlay,
    borderRadius: 4,
    padding: 3,
  },
  info: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  title: {
    ...Typography.h4,
    fontSize: 14,
    marginBottom: 2,
  },
  speaker: {
    ...Typography.bodySmall,
    fontSize: 12,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  timeText: {
    fontSize: 11,
    color: Colors.dim,
    fontVariant: ['tabular-nums'],
  },
  percentText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.card,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  dismissBtn: {
    padding: Spacing.sm,
    alignSelf: 'flex-start',
  },
});

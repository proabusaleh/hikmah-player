import { Clock, Download, Play } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { MediaItem } from '@/types/media';
import { formatTime } from '@/utils/formatters';

interface VideoCardProps {
  item: MediaItem;
  onPress: () => void;
  onDownload?: () => void;
  isDownloaded?: boolean;
  variant?: 'horizontal' | 'grid';
}

export const VideoCard: React.FC<VideoCardProps> = ({
  item,
  onPress,
  onDownload,
  isDownloaded = false,
  variant = 'horizontal',
}) => {
  const isGrid = variant === 'grid';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.base, isGrid ? styles.grid : styles.horizontal]}
      testID="video-card"
      accessibilityRole="button"
      accessibilityLabel={`Play video ${item.title}`}
    >
      <View style={[styles.thumbnail, isGrid ? styles.thumbnailGrid : styles.thumbnailHorizontal]}>
        {item.thumbnailUrl ? (
          <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbImage} />
        ) : (
          <View style={styles.thumbFallback}>
            <Play size={28} color={Colors.accent} fill={Colors.accent} />
          </View>
        )}

        <View style={styles.durationBadge}>
          <Clock size={10} color={Colors.white} />
          <Text style={styles.durationText}>{formatTime(item.duration)}</Text>
        </View>

        <View style={styles.playOverlay}>
          <View style={styles.playCircle}>
            <Play size={20} color={Colors.white} fill={Colors.white} style={{ marginLeft: 2 }} />
          </View>
        </View>
      </View>

      <View style={styles.info}>
        <Text numberOfLines={2} style={styles.title}>
          {item.title}
        </Text>
        <Text numberOfLines={1} style={styles.speaker}>
          {item.artistOrSpeaker || 'Hikmah Video'}
        </Text>
      </View>

      {onDownload && (
        <TouchableOpacity onPress={onDownload} style={styles.downloadBtn} activeOpacity={0.7}>
          <Download size={18} color={isDownloaded ? Colors.accent : Colors.muted} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
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
  grid: {
    flexDirection: 'column',
    width: '48%',
    marginBottom: Spacing.md,
  },
  thumbnail: {
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbnailHorizontal: {
    width: 130,
    height: 85,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  thumbnailGrid: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
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
  durationBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.overlay,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 3,
  },
  durationText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.white,
  },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  playCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  title: {
    ...Typography.h4,
    fontSize: 14,
    marginBottom: 4,
  },
  speaker: {
    ...Typography.bodySmall,
    fontSize: 12,
  },
  downloadBtn: {
    padding: Spacing.sm,
    alignSelf: 'center',
    marginRight: Spacing.sm,
  },
});

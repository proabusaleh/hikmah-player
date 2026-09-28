import { Film, FolderOpen, Heart, Music, Play, Tag } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { SearchResult } from '@/types/search';
import { formatTime } from '@/utils/formatters';

interface SearchResultCardProps {
  result: SearchResult;
  onPress: () => void;
  query: string;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({ result, onPress }) => {
  const { document: doc, score, matchedFields, highlightTitle } = result;
  const isVideo = doc.mediaType === 'video';

  // Parse highlighted title
  const renderHighlightedTitle = () => {
    const parts = highlightTitle.split(/(★[^★]+★)/g);
    return (
      <Text numberOfLines={1} style={styles.title}>
        {parts.map((part, i) => {
          if (part.startsWith('★') && part.endsWith('★')) {
            return (
              <Text key={i} style={styles.highlight}>
                {part.slice(1, -1)}
              </Text>
            );
          }
          return <Text key={i}>{part}</Text>;
        })}
      </Text>
    );
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.75}>
      {/* Thumbnail */}
      <View style={styles.thumbnail}>
        {doc.thumbnailUrl ? (
          <Image source={{ uri: doc.thumbnailUrl }} style={styles.thumbImage} />
        ) : (
          <View style={styles.thumbFallback}>
            {isVideo ? (
              <Film size={20} color={Colors.info} />
            ) : (
              <Music size={20} color={Colors.secondary} />
            )}
          </View>
        )}
        <View style={styles.playOverlay}>
          <Play size={12} color={Colors.white} fill={Colors.white} />
        </View>
      </View>

      {/* Info */}
      <View style={styles.info}>
        {renderHighlightedTitle()}

        {doc.artistOrSpeaker ? (
          <Text numberOfLines={1} style={styles.artist}>
            {doc.artistOrSpeaker}
          </Text>
        ) : null}

        {/* Matched Fields Tags */}
        <View style={styles.metaRow}>
          {doc.category !== 'General' && (
            <View style={styles.metaTag}>
              <FolderOpen size={10} color={Colors.accent} />
              <Text style={styles.metaTagText}>{doc.category}</Text>
            </View>
          )}

          {doc.playlistNames.length > 0 && (
            <View style={styles.metaTag}>
              <Tag size={10} color={Colors.info} />
              <Text style={styles.metaTagText}>{doc.playlistNames[0]}</Text>
            </View>
          )}

          <Text style={styles.duration}>{formatTime(doc.duration)}</Text>

          {doc.favorite && <Heart size={12} color={Colors.danger} fill={Colors.danger} />}
        </View>

        {/* Matched Fields Indicator */}
        <View style={styles.matchRow}>
          <Text style={styles.matchLabel}>Found in: {matchedFields.slice(0, 3).join(', ')}</Text>
          <View style={[styles.scoreBar, { width: `${Math.round(score * 60)}%` }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 70,
    height: 70,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
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
    marginBottom: 2,
  },
  highlight: {
    color: Colors.secondary,
    fontWeight: '800',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  artist: {
    ...Typography.bodySmall,
    fontSize: 12,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.card,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  metaTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.muted,
  },
  duration: {
    fontSize: 11,
    color: Colors.dim,
    fontVariant: ['tabular-nums'],
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchLabel: {
    fontSize: 10,
    color: Colors.dim,
    fontStyle: 'italic',
  },
  scoreBar: {
    height: 2,
    backgroundColor: Colors.secondary,
    borderRadius: 1,
    minWidth: 8,
  },
});

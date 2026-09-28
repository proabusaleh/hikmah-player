import { Music } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { MediaItem } from '@/types/media';

interface TrackInfoProps {
  track: MediaItem | null;
  size?: 'small' | 'large';
}

export const TrackInfo: React.FC<TrackInfoProps> = ({ track, size = 'large' }) => {
  const isLarge = size === 'large';

  if (!track) return null;

  return (
    <View style={[styles.container, isLarge && styles.containerLarge]}>
      <View style={[styles.artworkContainer, isLarge ? styles.artworkLarge : styles.artworkSmall]}>
        {track.thumbnailUrl ? (
          <Image source={{ uri: track.thumbnailUrl }} style={styles.image} />
        ) : (
          <View style={styles.fallbackArtwork}>
            <Music size={isLarge ? 64 : 24} color={Colors.dark.primary} />
          </View>
        )}
      </View>

      <View style={[styles.textDetails, !isLarge && styles.textDetailsSmall]}>
        <Text
          numberOfLines={1}
          style={[styles.title, isLarge ? styles.titleLarge : styles.titleSmall]}
        >
          {track.title}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.artist, isLarge ? styles.artistLarge : styles.artistSmall]}
        >
          {track.artistOrSpeaker || 'Hikmah Audio'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerLarge: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  artworkContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.dark.card,
  },
  artworkLarge: {
    width: 260,
    height: 260,
    marginBottom: 28,
  },
  artworkSmall: {
    width: 46,
    height: 46,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  fallbackArtwork: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
  },
  textDetails: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  textDetailsSmall: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 12,
  },
  title: {
    color: Colors.dark.text,
    fontWeight: '700',
  },
  titleLarge: {
    fontSize: 22,
    marginBottom: 6,
    textAlign: 'center',
  },
  titleSmall: {
    fontSize: 14,
  },
  artist: {
    color: Colors.dark.textMuted,
  },
  artistLarge: {
    fontSize: 16,
    textAlign: 'center',
  },
  artistSmall: {
    fontSize: 12,
  },
});

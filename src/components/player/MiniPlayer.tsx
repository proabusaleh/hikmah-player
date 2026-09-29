import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { PlayerControls } from './PlayerControls';
import { TrackInfo } from './TrackInfo';

export const MiniPlayer: React.FC = () => {
  const router = useRouter();
  const { currentTrack, status, position, duration, togglePlayPause, skipNext, skipPrevious } =
    useAudioPlayback();

  if (!currentTrack || status === 'idle') return null;

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.95}
      onPress={() => router.navigate('/player')}
    >
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.content}>
        <View style={styles.infoWrap}>
          <TrackInfo track={currentTrack} size="small" />
        </View>
        <PlayerControls
          status={status}
          onTogglePlayPause={togglePlayPause}
          onSkipNext={skipNext}
          onSkipPrevious={skipPrevious}
          size="small"
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Spacing.sm,
    zIndex: 50,
  },
  progressBg: {
    height: 2,
    backgroundColor: Colors.border,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.secondary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  infoWrap: {
    flex: 1,
    marginRight: Spacing.sm,
  },
});

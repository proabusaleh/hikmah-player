import {
    Pause,
    Play,
    RotateCcw,
    RotateCw,
    SkipBack,
    SkipForward,
} from 'lucide-react-native';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { PlaybackStatus } from '@/types/media';

interface PlayerControlsProps {
  status: PlaybackStatus;
  onTogglePlayPause: () => void;
  onSkipNext: () => void;
  onSkipPrevious: () => void;
  onSeekRelative?: (seconds: number) => void;
  size?: 'small' | 'large';
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  status,
  onTogglePlayPause,
  onSkipNext,
  onSkipPrevious,
  onSeekRelative,
  size = 'large',
}) => {
  const isLarge = size === 'large';
  const iconSize = isLarge ? 28 : 20;
  const playIconSize = isLarge ? 36 : 24;

  return (
    <View style={styles.container}>
      {isLarge && onSeekRelative && (
        <TouchableOpacity
          onPress={() => onSeekRelative(-10)}
          style={styles.secondaryButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Rewind 10 seconds"
        >
          <RotateCcw size={iconSize} color={Colors.dark.textMuted} />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={onSkipPrevious}
        style={styles.secondaryButton}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Previous track"
        testID="prev-button"
      >
        <SkipBack size={iconSize} color={Colors.dark.text} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onTogglePlayPause}
        style={[
          styles.playButton,
          isLarge ? styles.playButtonLarge : styles.playButtonSmall,
        ]}
        activeOpacity={0.8}
        disabled={status === 'buffering'}
        accessibilityRole="button"
        accessibilityLabel={status === 'playing' ? 'Pause' : 'Play'}
        accessibilityState={{ disabled: status === 'buffering' }}
        testID="play-pause-button"
      >
        {status === 'buffering' ? (
          <ActivityIndicator color="#FFFFFF" size="small" testID="loading-indicator" />
        ) : status === 'playing' ? (
          <Pause size={playIconSize} color="#FFFFFF" fill="#FFFFFF" />
        ) : (
          <Play
            size={playIconSize}
            color="#FFFFFF"
            fill="#FFFFFF"
            style={{ marginLeft: 3 }}
          />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSkipNext}
        style={styles.secondaryButton}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Next track"
        testID="next-button"
      >
        <SkipForward size={iconSize} color={Colors.dark.text} />
      </TouchableOpacity>

      {isLarge && onSeekRelative && (
        <TouchableOpacity
          onPress={() => onSeekRelative(10)}
          style={styles.secondaryButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Forward 10 seconds"
        >
          <RotateCw size={iconSize} color={Colors.dark.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  secondaryButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonLarge: {
    width: 68,
    height: 68,
  },
  playButtonSmall: {
    width: 44,
    height: 44,
  },
});

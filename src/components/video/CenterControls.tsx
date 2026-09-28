import { Pause, Play, SkipBack, SkipForward } from 'lucide-react-native';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

interface CenterControlsProps {
  isPlaying: boolean;
  isBuffering: boolean;
  onPlayPause: () => void;
  onRewind: () => void;
  onForward: () => void;
}

export const CenterControls: React.FC<CenterControlsProps> = ({
  isPlaying,
  isBuffering,
  onPlayPause,
  onRewind,
  onForward,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onRewind} style={styles.sideButton} activeOpacity={0.6}>
        <SkipBack size={30} color={Colors.white} fill={Colors.white} />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onPlayPause}
        style={styles.playButton}
        activeOpacity={0.8}
        disabled={isBuffering}
      >
        {isBuffering ? (
          <ActivityIndicator size="large" color={Colors.white} />
        ) : isPlaying ? (
          <Pause size={38} color={Colors.white} fill={Colors.white} />
        ) : (
          <Play
            size={38}
            color={Colors.white}
            fill={Colors.white}
            style={{ marginLeft: 4 }}
          />
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={onForward} style={styles.sideButton} activeOpacity={0.6}>
        <SkipForward size={30} color={Colors.white} fill={Colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 48,
  },
  sideButton: {
    padding: Spacing.md,
    opacity: 0.85,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
});

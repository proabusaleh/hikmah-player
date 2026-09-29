import {
    ChevronLeft,
    Maximize,
    Minimize,
    Pause,
    Play,
    RotateCcw,
    RotateCw,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

import { ProgressBar } from '@/components/player/ProgressBar';
import { Colors } from '@/constants/colors';

interface VideoControlsOverlayProps {
  title: string;
  isPlaying: boolean;
  isBuffering: boolean;
  position: number;
  duration: number;
  isFullscreen: boolean;
  onPlayPause: () => void;
  onSeek: (positionMs: number) => void;
  onSeekRelative: (seconds: number) => void;
  onToggleFullscreen: () => void;
  onBack: () => void;
}

export const VideoControlsOverlay: React.FC<VideoControlsOverlayProps> = ({
  title,
  isPlaying,
  isBuffering,
  position,
  duration,
  isFullscreen,
  onPlayPause,
  onSeek,
  onSeekRelative,
  onToggleFullscreen,
  onBack,
}) => {
  const [visible, setVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startHideTimer = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    hideTimerRef.current = setTimeout(() => {
      if (isPlaying) {
        setVisible(false);
      }
    }, 3500);
  }, [isPlaying]);

  const toggleVisibility = () => {
    setVisible((prev) => !prev);
    if (!visible) {
      startHideTimer();
    }
  };

  useEffect(() => {
    if (visible && isPlaying) {
      startHideTimer();
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [visible, isPlaying, startHideTimer]);

  return (
    <TouchableWithoutFeedback onPress={toggleVisibility}>
      <View style={styles.touchContainer}>
        {visible && (
          <View style={styles.overlay}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                <ChevronLeft size={28} color="#FFFFFF" />
              </TouchableOpacity>
              <Text numberOfLines={1} style={styles.videoTitle}>
                {title}
              </Text>
            </View>

            <View style={styles.centerControls}>
              <TouchableOpacity
                onPress={() => {
                  onSeekRelative(-10);
                  startHideTimer();
                }}
                style={styles.iconButton}
              >
                <RotateCcw size={30} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  onPlayPause();
                  startHideTimer();
                }}
                style={styles.playPauseButton}
              >
                {isBuffering ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : isPlaying ? (
                  <Pause size={36} color="#FFFFFF" fill="#FFFFFF" />
                ) : (
                  <Play size={36} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 3 }} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  onSeekRelative(10);
                  startHideTimer();
                }}
                style={styles.iconButton}
              >
                <RotateCw size={30} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.bottomBar}>
              <View style={styles.progressWrapper}>
                <ProgressBar
                  position={position}
                  duration={duration}
                  onSeek={(pos) => {
                    onSeek(pos);
                    startHideTimer();
                  }}
                />
              </View>

              <TouchableOpacity onPress={onToggleFullscreen} style={styles.fullscreenButton}>
                {isFullscreen ? (
                  <Minimize size={22} color="#FFFFFF" />
                ) : (
                  <Maximize size={22} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  touchContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'space-between',
    padding: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  iconButton: {
    padding: 8,
  },
  videoTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
  },
  playPauseButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  progressWrapper: {
    flex: 1,
    marginRight: 8,
  },
  fullscreenButton: {
    padding: 8,
    marginBottom: 8,
  },
});

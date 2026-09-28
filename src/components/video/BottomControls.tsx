import {
    Gauge,
    Lock,
    Maximize,
    Minimize,
    Settings,
    Unlock,
    Volume2,
    VolumeX,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { formatTime } from '@/utils/formatters';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BottomControlsProps {
  currentTime: number;
  duration: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isLocked: boolean;
  playbackRate: number;
  onSeek: (timeInSeconds: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onToggleLock: () => void;
  onOpenSettings: () => void;
}

export const BottomControls: React.FC<BottomControlsProps> = ({
  currentTime,
  duration,
  isMuted,
  isFullscreen,
  isLocked,
  playbackRate,
  onSeek,
  onToggleMute,
  onToggleFullscreen,
  onToggleLock,
  onOpenSettings,
}) => {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);

  const displayTime = isSeeking ? seekPosition : currentTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  const handleProgressPress = (locationX: number) => {
    const trackWidth = SCREEN_WIDTH - (isFullscreen ? 64 : 32);
    const fraction = Math.max(0, Math.min(1, locationX / trackWidth));
    const targetTime = fraction * duration;
    setSeekPosition(targetTime);
    onSeek(targetTime);
  };

  return (
    <View style={[styles.container, isFullscreen && styles.fullscreenPadding]}>
      <View style={styles.progressSection}>
        <TouchableOpacity
          style={styles.progressTrack}
          activeOpacity={1}
          onPressIn={() => setIsSeeking(true)}
          onPressOut={() => setIsSeeking(false)}
          onPress={(event) => handleProgressPress(event.nativeEvent.locationX)}
        >
          <View style={[styles.bufferedBar, { width: `${Math.min(progressPercent + 10, 100)}%` }]} />
          <View style={[styles.playedBar, { width: `${progressPercent}%` }]} />
          <View
            style={[
              styles.thumb,
              { left: `${Math.min(progressPercent, 97)}%` },
              isSeeking && styles.thumbActive,
            ]}
          />
        </TouchableOpacity>

        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(displayTime)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={onToggleMute} style={styles.actionBtn} activeOpacity={0.7}>
          {isMuted ? <VolumeX size={20} color={Colors.white} /> : <Volume2 size={20} color={Colors.white} />}
        </TouchableOpacity>

        {playbackRate !== 1 ? (
          <TouchableOpacity onPress={onOpenSettings} style={styles.speedBadge} activeOpacity={0.7}>
            <Gauge size={14} color={Colors.accent} />
            <Text style={styles.speedBadgeText}>{playbackRate}x</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.spacer} />

        <TouchableOpacity onPress={onToggleLock} style={styles.actionBtn} activeOpacity={0.7}>
          {isLocked ? <Lock size={18} color={Colors.warning} /> : <Unlock size={18} color={Colors.white} />}
        </TouchableOpacity>

        <TouchableOpacity onPress={onOpenSettings} style={styles.actionBtn} activeOpacity={0.7}>
          <Settings size={20} color={Colors.white} />
        </TouchableOpacity>

        <TouchableOpacity onPress={onToggleFullscreen} style={styles.actionBtn} activeOpacity={0.7}>
          {isFullscreen ? <Minimize size={20} color={Colors.white} /> : <Maximize size={20} color={Colors.white} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  fullscreenPadding: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxl,
  },
  progressSection: {
    width: '100%',
    marginBottom: Spacing.sm,
  },
  progressTrack: {
    height: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  bufferedBar: {
    position: 'absolute',
    left: 0,
    top: 10,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  playedBar: {
    position: 'absolute',
    left: 0,
    top: 10,
    height: 4,
    backgroundColor: Colors.secondary,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    top: 5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.accent,
    marginLeft: -7,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  thumbActive: {
    width: 18,
    height: 18,
    borderRadius: 9,
    top: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  actionBtn: {
    padding: Spacing.sm,
    marginHorizontal: 2,
  },
  speedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(52,211,153,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    marginHorizontal: 4,
  },
  speedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accent,
  },
  spacer: {
    flex: 1,
  },
});

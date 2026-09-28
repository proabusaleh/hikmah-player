import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import {
    ChevronDown,
    Heart,
    ListMusic,
    MoreHorizontal,
    Repeat,
    Repeat1,
    Share2,
    Shuffle,
    Timer,
    Volume2,
    VolumeX,
} from 'lucide-react-native';
import { useState } from 'react';
import {
    FlatList,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { AudioCard } from '@/components/cards/AudioCard';
import { BottomSheet } from '@/components/common/BottomSheet';
import { HikmahIconButton } from '@/components/common/HikmahIconButton';
import { PlayerControls } from '@/components/player/PlayerControls';
import { ProgressBar } from '@/components/player/ProgressBar';
import { TrackInfo } from '@/components/player/TrackInfo';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useSleepTimer } from '@/hooks/useSleepTimer';

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
const SLEEP_OPTIONS = [15, 30, 45, 60, 90];

export default function AudioPlayerScreen() {
  const router = useRouter();
  const {
    currentTrack,
    status,
    position,
    duration,
    playbackSpeed,
    volume,
    isMuted,
    queue,
    currentIndex,
    isShuffled,
    repeatMode,
    togglePlayPause,
    seekTo,
    seekRelative,
    skipNext,
    skipPrevious,
    toggleShuffle,
    cycleRepeatMode,
    setPlaybackSpeed,
    setVolume,
    toggleMute,
    playTrackAtIndex,
  } = useAudioPlayback();

  const { isActive: isSleepActive, formattedRemaining, startTimer, cancelTimer } = useSleepTimer();

  const [showQueue, setShowQueue] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);
  const [showSleep, setShowSleep] = useState(false);

  const handleRelativeSeek = (seconds: number) => {
    seekRelative(seconds);
  };

  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;
  const repeatColor = repeatMode === 'off' ? Colors.dim : Colors.secondary;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} activeOpacity={0.8}>
          <ChevronDown size={28} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>NOW PLAYING</Text>
          <Text numberOfLines={1} style={styles.headerSource}>
            {currentTrack?.type === 'audio' ? '🎵 Audio' : '🎬 Video'} • Queue ({queue.length})
          </Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} activeOpacity={0.8}>
          <MoreHorizontal size={24} color={Colors.muted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        <TrackInfo track={currentTrack} size="large" />

        <View style={styles.actionRow}>
          <HikmahIconButton icon={<Heart size={20} color={Colors.muted} />} onPress={() => {}} size="sm" />
          <HikmahIconButton icon={<Share2 size={20} color={Colors.muted} />} onPress={() => {}} size="sm" />
          <HikmahIconButton
            icon={
              <View style={styles.timerIconWrap}>
                <Timer size={20} color={isSleepActive ? Colors.warning : Colors.muted} />
                {isSleepActive && <Text style={styles.timerBadge}>{formattedRemaining}</Text>}
              </View>
            }
            onPress={() => setShowSleep(true)}
            size="sm"
          />
          <HikmahIconButton
            icon={<Text style={[styles.speedIcon, playbackSpeed !== 1 && styles.speedIconActive]}>{playbackSpeed}x</Text>}
            onPress={() => setShowSpeed(true)}
            size="sm"
          />
        </View>

        <View style={styles.progressSection}>
          <ProgressBar position={position} duration={duration} onSeek={seekTo} />
        </View>

        <View style={styles.controlsSection}>
          <PlayerControls
            status={status}
            onTogglePlayPause={togglePlayPause}
            onSkipNext={skipNext}
            onSkipPrevious={skipPrevious}
            onSeekRelative={handleRelativeSeek}
            size="large"
          />
        </View>

        <View style={styles.modeRow}>
          <TouchableOpacity onPress={toggleShuffle} style={styles.modeBtn} activeOpacity={0.8}>
            <Shuffle size={20} color={isShuffled ? Colors.secondary : Colors.dim} />
          </TouchableOpacity>

          <TouchableOpacity onPress={cycleRepeatMode} style={styles.modeBtn} activeOpacity={0.8}>
            <RepeatIcon size={20} color={repeatColor} />
            {repeatMode !== 'off' && <View style={styles.modeDot} />}
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleMute} style={styles.modeBtn} activeOpacity={0.8}>
            {isMuted ? <VolumeX size={20} color={Colors.dim} /> : <Volume2 size={20} color={Colors.text} />}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowQueue(true)} style={styles.modeBtn} activeOpacity={0.8}>
            <ListMusic size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.volumeSection}>
          <VolumeX size={14} color={Colors.dim} />
          <Slider
            style={styles.volumeSlider}
            minimumValue={0}
            maximumValue={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            minimumTrackTintColor={Colors.secondary}
            maximumTrackTintColor={Colors.border}
            thumbTintColor={Colors.accent}
            onValueChange={setVolume}
          />
          <Volume2 size={14} color={Colors.text} />
        </View>
      </ScrollView>

      <BottomSheet
        visible={showQueue}
        title={`Up Next (${queue.length} tracks)`}
        onClose={() => setShowQueue(false)}
        snapHeight={0.6}
      >
        <FlatList
          data={queue}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item, index }) => (
            <AudioCard
              item={item}
              index={index}
              isPlaying={index === currentIndex && status === 'playing'}
              onPress={() => {
                void playTrackAtIndex(index);
                setShowQueue(false);
              }}
            />
          )}
        />
      </BottomSheet>

      <BottomSheet
        visible={showSpeed}
        title="Playback Speed"
        onClose={() => setShowSpeed(false)}
        snapHeight={0.35}
      >
        <View style={styles.speedGrid}>
          {SPEED_OPTIONS.map((speed) => (
            <TouchableOpacity
              key={speed}
              style={[styles.speedChip, playbackSpeed === speed && styles.speedChipActive]}
              onPress={() => {
                void setPlaybackSpeed(speed);
                setShowSpeed(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.speedChipText, playbackSpeed === speed && styles.speedChipTextActive]}>
                {speed}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>

      <BottomSheet
        visible={showSleep}
        title="Sleep Timer"
        onClose={() => setShowSleep(false)}
        snapHeight={0.4}
      >
        {isSleepActive ? (
          <View style={styles.sleepActive}>
            <Timer size={40} color={Colors.warning} />
            <Text style={styles.sleepRemaining}>{formattedRemaining}</Text>
            <Text style={styles.sleepLabel}>remaining</Text>
            <TouchableOpacity
              style={styles.cancelTimerBtn}
              onPress={() => {
                cancelTimer();
                setShowSleep(false);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelTimerText}>Cancel Timer</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.sleepGrid}>
            {SLEEP_OPTIONS.map((minutes) => (
              <TouchableOpacity
                key={minutes}
                style={styles.sleepChip}
                onPress={() => {
                  startTimer(minutes);
                  setShowSleep(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.sleepChipText}>{minutes} min</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.md,
  },
  headerBtn: {
    padding: Spacing.sm,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerLabel: {
    ...Typography.caption,
    color: Colors.secondary,
    letterSpacing: 1.5,
  },
  headerSource: {
    ...Typography.bodySmall,
    marginTop: 2,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 40,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xxl,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  timerIconWrap: {
    alignItems: 'center',
  },
  timerBadge: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.warning,
    marginTop: -2,
  },
  speedIcon: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.muted,
  },
  speedIconActive: {
    color: Colors.secondary,
  },
  progressSection: {
    width: '100%',
    marginTop: Spacing.md,
  },
  controlsSection: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  modeBtn: {
    padding: Spacing.sm,
    position: 'relative',
  },
  modeDot: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
  },
  volumeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  volumeSlider: {
    flex: 1,
    height: 30,
  },
  speedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  speedChip: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 70,
    alignItems: 'center',
  },
  speedChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  speedChipText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  speedChipTextActive: {
    color: Colors.background,
  },
  sleepGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  sleepChip: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 80,
    alignItems: 'center',
  },
  sleepChipText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  sleepActive: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  sleepRemaining: {
    ...Typography.h1,
    color: Colors.warning,
    fontVariant: ['tabular-nums'],
  },
  sleepLabel: {
    ...Typography.body,
    color: Colors.muted,
  },
  cancelTimerBtn: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  cancelTimerText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.danger,
  },
});

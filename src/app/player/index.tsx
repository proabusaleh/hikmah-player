import { BlurView } from 'expo-blur';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import {
    ChevronDown,
    Heart,
    ListMusic,
    MoreHorizontal,
    Music,
    Repeat,
    Repeat1,
    Share2,
    Shuffle,
    Sparkles,
    Timer,
    Volume2,
    VolumeX,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
    Animated,
    FlatList,
    Image,
    PanResponder,
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
import { SmartPlaybackOverlay } from '@/components/player/SmartPlaybackOverlay';
import { SmartQueueSheet } from '@/components/player/SmartQueueSheet';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useAudioPlayback } from '@/hooks/useAudioPlayback';
import { useSleepTimer } from '@/hooks/useSleepTimer';
import { SmartQueueItem } from '@/types/smartPlayback';

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
    setQueue,
    playMedia,
  } = useAudioPlayback();

  const { isActive: isSleepActive, formattedRemaining, startTimer, cancelTimer } = useSleepTimer();

  const [showQueue, setShowQueue] = useState(false);
  const [showSpeed, setShowSpeed] = useState(false);
  const [showSleep, setShowSleep] = useState(false);
  const [showSmartQueue, setShowSmartQueue] = useState(false);

  // Entrance animation + draggable artwork (fling sideways for prev/next).
  const [enterAnim] = useState(() => new Animated.Value(0));
  const [artX] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(enterAnim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  }, [enterAnim]);

  useEffect(() => {
    artX.setValue(0);
  }, [currentTrack?.id, artX]);

  const artPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderMove: (_, gestureState) => {
          artX.setValue(gestureState.dx);
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -80) {
            skipNext();
          } else if (gestureState.dx > 80) {
            skipPrevious();
          }
          Animated.spring(artX, {
            toValue: 0,
            tension: 300,
            friction: 30,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(artX, {
            toValue: 0,
            tension: 300,
            friction: 30,
            useNativeDriver: true,
          }).start();
        },
      }),
    [artX, skipNext, skipPrevious]
  );

  const handleRelativeSeek = (seconds: number) => {
    seekRelative(seconds);
  };

  const handleSmartQueuePlay = (item: SmartQueueItem) => {
    setQueue([item.media], 0);
    playMedia(item.media);
    setShowSmartQueue(false);
  };

  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;
  const repeatColor = repeatMode === 'off' ? Colors.dim : Colors.secondary;

  return (
    <View style={styles.container}>
      {currentTrack?.thumbnailUrl ? (
        <Image source={{ uri: currentTrack.thumbnailUrl }} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.bgFallback]} />
      )}
      <BlurView intensity={72} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.scrim]} />

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
        <Animated.View
          style={[
            styles.artworkSection,
            {
              opacity: enterAnim,
              transform: [
                {
                  translateY: enterAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [28, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Animated.View style={[styles.artworkCard, { transform: [{ translateX: artX }] }]} {...artPanResponder.panHandlers}>
            {currentTrack?.thumbnailUrl ? (
              <Image source={{ uri: currentTrack.thumbnailUrl }} style={styles.artworkImage} />
            ) : (
              <View style={styles.artworkFallback}>
                <Music size={84} color={Colors.secondary} />
              </View>
            )}
          </Animated.View>
          <Text numberOfLines={1} style={styles.trackTitle}>
            {currentTrack?.title ?? 'No track'}
          </Text>
          <Text numberOfLines={1} style={styles.trackArtist}>
            {currentTrack?.artistOrSpeaker || 'Hikmah Audio'}
          </Text>
          <Text style={styles.swipeHint}>Swipe artwork to change track</Text>
        </Animated.View>

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
            testID="sleep-button"
            accessibilityLabel="Sleep timer"
          />
          <HikmahIconButton
            icon={<Text style={[styles.speedIcon, playbackSpeed !== 1 && styles.speedIconActive]}>{playbackSpeed}x</Text>}
            onPress={() => setShowSpeed(true)}
            size="sm"
            testID="speed-button"
            accessibilityLabel="Playback speed"
          />
        </View>

        <BlurView intensity={36} tint="dark" style={styles.controlCard}>
          <ProgressBar position={position} duration={duration} onSeek={seekTo} />
          <PlayerControls
            status={status}
            onTogglePlayPause={togglePlayPause}
            onSkipNext={skipNext}
            onSkipPrevious={skipPrevious}
            onSeekRelative={handleRelativeSeek}
            size="large"
          />
        </BlurView>

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

          <TouchableOpacity onPress={() => setShowSmartQueue(true)} style={styles.modeBtn} activeOpacity={0.8}>
            <Sparkles size={20} color={Colors.accent} />
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

      {/* ── Smart Playback: network/quality chips, skip button, resume, up-next ── */}
      <SmartPlaybackOverlay onSeek={(sec) => void seekTo(sec * 1000)} />

      <SmartQueueSheet
        visible={showSmartQueue}
        onClose={() => setShowSmartQueue(false)}
        onPlayItem={handleSmartQueuePlay}
      />

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
  bgFallback: {
    backgroundColor: '#0B1F16',
  },
  scrim: {
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
  },
  artworkSection: {
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  artworkCard: {
    width: 280,
    height: 280,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
    marginBottom: Spacing.xl,
  },
  artworkImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  artworkFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  trackTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.3,
    paddingHorizontal: Spacing.lg,
  },
  trackArtist: {
    fontSize: 15,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 4,
  },
  swipeHint: {
    fontSize: 11,
    color: Colors.dim,
    textAlign: 'center',
    marginTop: 8,
  },
  controlCard: {
    width: '100%',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
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

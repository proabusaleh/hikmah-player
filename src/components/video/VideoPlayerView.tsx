import * as Brightness from 'expo-brightness';
import { useRouter } from 'expo-router';
import { VideoView } from 'expo-video';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';

import { BottomControls } from '@/components/video/BottomControls';
import { CenterControls } from '@/components/video/CenterControls';
import { GestureIndicator, type GestureIndicatorKind } from '@/components/video/GestureIndicator';
import { GestureLayer } from '@/components/video/GestureLayer';
import { PlayerHeader } from '@/components/video/PlayerHeader';
import { PlayerSettingsSheet } from '@/components/video/PlayerSettingsSheet';
import { WebVideoPlayer } from '@/components/video/WebVideoPlayer';
import { useScreenOrientation } from '@/hooks/useScreenOrientation';
import { usePlatformVideoEngine } from '@/hooks/usePlatformVideoEngine';
import { clamp } from '@/services/video/videoEngine';
import { useSettingsStore } from '@/store/useSettingsStore';
import { formatTime } from '@/utils/formatters';

interface VideoPlayerViewProps {
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  initialTime?: number;
}

export const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({ title, videoUrl, initialTime = 0 }) => {
  const router = useRouter();
  const videoRef = useRef<VideoView>(null);
  const webVideoRef = useRef<{ play: () => void; pause: () => void; seekTo: (time: number) => void } | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fadeAnim] = useState(() => new Animated.Value(1));

  const { isFullscreen, toggleFullscreen, resetToPortrait } = useScreenOrientation();
  const [isFullscreenVideo, setIsFullscreenVideo] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const hasAppliedInitialTimeRef = useRef(false);
  const settingsPlaybackSpeed = useSettingsStore((s) => s.playbackSpeed);
  const settingsQuality = useSettingsStore((s) => s.quality);

  // Swipe-gesture adjustment state: vertical right = volume, left = brightness.
  const [indicator, setIndicator] = useState<{
    kind: GestureIndicatorKind;
    fraction: number;
    label: string;
  } | null>(null);
  const indicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gestureBaselineRef = useRef<{
    volume: number;
    brightness: number;
    side: 'left' | 'right' | null;
  } | null>(null);
  const brightnessRef = useRef(1);
  const initialBrightnessRef = useRef<number | null>(null);

  const {
    player,
    isPlaying,
    isBuffering,
    position,
    duration,
    playbackRate,
    volume,
    isMuted,
    status,
    togglePlayPause,
    seekBy,
    seekTo,
    setRate,
    setVolume,
    toggleMute,
    isWeb,
  } = usePlatformVideoEngine(videoUrl, title);

  const effectiveFullscreen = isFullscreen || isFullscreenVideo;

  useEffect(() => () => {
    resetToPortrait();
  }, [resetToPortrait]);

  // Remember the system brightness on entry (native only) and restore it on
  // exit — swipe brightness only overrides it while watching.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let cancelled = false;
    void Brightness.getBrightnessAsync()
      .then((level) => {
        if (!cancelled && Number.isFinite(level)) {
          initialBrightnessRef.current = level;
          brightnessRef.current = level;
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (initialBrightnessRef.current != null) {
        void Brightness.setBrightnessAsync(initialBrightnessRef.current).catch(() => {});
      }
      if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current);
    };
  }, []);

  // Apply the persisted playback-speed setting to the player. The equality
  // guard guarantees this terminates instead of ping-ponging setState.
  useEffect(() => {
    if (settingsPlaybackSpeed !== playbackRate) {
      setRate(settingsPlaybackSpeed);
    }
  }, [settingsPlaybackSpeed, playbackRate, setRate]);

  // Seek to the initial position exactly once, when the player is ready.
  useEffect(() => {
    if (!hasAppliedInitialTimeRef.current && initialTime > 0 && player && status === 'readyToPlay') {
      hasAppliedInitialTimeRef.current = true;
      seekTo(initialTime);
    }
  }, [player, initialTime, status, seekTo]);

  useEffect(() => {
    if (!controlsVisible || !isPlaying || settingsVisible || isLocked) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      return;
    }

    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 3500);

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [controlsVisible, isPlaying, settingsVisible, isLocked]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: controlsVisible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [controlsVisible, fadeAnim]);

  const handleToggleControls = () => {
    if (isLocked) return;
    setControlsVisible((prev) => !prev);
  };

  const handleSeekRelative = (seconds: number) => {
    if (isLocked) return;
    seekBy(seconds);
  };

  // Native fullscreen can be out of sync with our UI state (e.g. on web,
  // where entering requires a user gesture and exiting when never entered
  // rejects with "Not in fullscreen mode"). Never let that reject the
  // handlers — the React state below already reflects the desired UI.
  const setNativeFullscreen = async (enable: boolean) => {
    try {
      if (enable) {
        await videoRef.current?.enterFullscreen();
      } else {
        await videoRef.current?.exitFullscreen();
      }
    } catch {
      // Ignore: UI state is the source of truth.
    }
  };

  const handleBack = async () => {
    if (effectiveFullscreen) {
      setIsFullscreenVideo(false);
      await setNativeFullscreen(false);
      await toggleFullscreen();
      return;
    }

    router.back();
  };

  const handleToggleFullscreen = async () => {
    if (isLocked) return;

    const nextValue = !effectiveFullscreen;
    setIsFullscreenVideo(nextValue);

    await setNativeFullscreen(nextValue);
    await toggleFullscreen();
  };

  const handleOpenSettings = () => {
    setSettingsVisible(true);
    setControlsVisible(true);
  };

  const showIndicator = (next: { kind: GestureIndicatorKind; fraction: number; label: string }) => {
    setIndicator(next);
    if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current);
    indicatorTimerRef.current = setTimeout(() => setIndicator(null), 1200);
  };

  // Snapshot live levels when a pan takes over; move deltas (dy) are
  // cumulative from gesture start, so every move recomputes from baseline.
  const handleGestureStart = () => {
    gestureBaselineRef.current = { volume, brightness: brightnessRef.current, side: null };
  };

  // Full 0..1 range over a 300px vertical drag. Right half = volume,
  // left half = brightness (native only). The side latches on the first
  // move so drifting across the middle mid-swipe can't flip the control.
  const handleVerticalSwipe = (side: 'left' | 'right', dy: number) => {
    if (isLocked) return;
    const baseline = gestureBaselineRef.current;
    if (!baseline) return;
    const activeSide = baseline.side ?? side;
    baseline.side = activeSide;
    const delta = -dy / 300;

    if (activeSide === 'right') {
      const next = clamp(baseline.volume + delta, 0, 1);
      setVolume(next);
      showIndicator({
        kind: 'volume',
        fraction: next,
        label: `Volume ${Math.round(next * 100)}%`,
      });
      return;
    }

    if (Platform.OS === 'web') return;
    const next = clamp(baseline.brightness + delta, 0.01, 1);
    brightnessRef.current = next;
    void Brightness.setBrightnessAsync(next).catch(() => {});
    showIndicator({
      kind: 'brightness',
      fraction: next,
      label: `Brightness ${Math.round(next * 100)}%`,
    });
  };

  return (
    <View style={[styles.container, effectiveFullscreen && styles.fullscreenContainer]}>
      {isWeb ? (
        <WebVideoPlayer
          ref={webVideoRef as any}
          sourceUri={videoUrl}
          isPlaying={isPlaying}
          position={position}
          playbackRate={playbackRate}
          onReady={() => {
            if (initialTime > 0) {
              webVideoRef.current?.seekTo(initialTime);
            }
          }}
        />
      ) : (
        <VideoView
          ref={videoRef}
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
          testID="video-view"
          fullscreenOptions={{ enable: true }}
          allowsPictureInPicture={false}
          onFullscreenEnter={() => {
            setIsFullscreenVideo(true);
            toggleFullscreen();
          }}
          onFullscreenExit={() => {
            setIsFullscreenVideo(false);
            toggleFullscreen();
          }}
        />
      )}

      <GestureLayer
        onSingleTap={handleToggleControls}
        onDoubleTapLeft={() => handleSeekRelative(-10)}
        onDoubleTapRight={() => handleSeekRelative(10)}
        onGestureStart={handleGestureStart}
        onVerticalSwipe={handleVerticalSwipe}
        onSwipeProgress={(direction, delta) => {
          if (isLocked) return;
          if (direction === 'left' || direction === 'right') {
            const offset = Math.max(-30, Math.min(30, delta / 18));
            const target = Math.max(0, Math.min(duration, position + offset));
            seekTo(target);
            showIndicator({
              kind: 'seek',
              fraction: 0,
              label: `${offset >= 0 ? '+' : '-'}${Math.abs(Math.round(offset))}s · ${formatTime(target)}`,
            });
          }
        }}
        onSwipeUp={() => setControlsVisible(true)}
        onSwipeDown={() => setControlsVisible(true)}
      >
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} pointerEvents={controlsVisible ? 'auto' : 'none'}>
          <PlayerHeader
            title={title}
            subtitle={settingsQuality === 'auto' ? 'Auto quality' : settingsQuality}
            isFullscreen={effectiveFullscreen}
            onBack={handleBack}
            onMore={() => setSettingsVisible(true)}
          />

          <View style={styles.centerArea}>
            <CenterControls
              isPlaying={isPlaying}
              isBuffering={isBuffering}
              onPlayPause={() => {
                togglePlayPause();
                setControlsVisible(true);
              }}
              onRewind={() => handleSeekRelative(-10)}
              onForward={() => handleSeekRelative(10)}
            />
          </View>

          <BottomControls
            currentTime={position}
            duration={duration}
            isMuted={isMuted}
            isFullscreen={effectiveFullscreen}
            isLocked={isLocked}
            playbackRate={playbackRate}
            onSeek={(value) => seekTo(value)}
            onToggleMute={toggleMute}
            onToggleFullscreen={handleToggleFullscreen}
            onToggleLock={() => setIsLocked((prev) => !prev)}
            onOpenSettings={handleOpenSettings}
          />
        </Animated.View>
      </GestureLayer>

      {indicator ? (
        <GestureIndicator
          visible
          kind={indicator.kind}
          fraction={indicator.fraction}
          label={indicator.label}
        />
      ) : null}

      <PlayerSettingsSheet visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  fullscreenContainer: {
    backgroundColor: '#000000',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    justifyContent: 'space-between',
  },
  centerArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

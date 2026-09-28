import { useRouter } from 'expo-router';
import { VideoView } from 'expo-video';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { BottomControls } from '@/components/video/BottomControls';
import { CenterControls } from '@/components/video/CenterControls';
import { GestureLayer } from '@/components/video/GestureLayer';
import { PlayerHeader } from '@/components/video/PlayerHeader';
import { PlayerSettingsSheet } from '@/components/video/PlayerSettingsSheet';
import { useScreenOrientation } from '@/hooks/useScreenOrientation';
import { useVideoEngine } from '@/hooks/useVideoEngine';
import type { VideoQualityValue } from '@/services/video/videoEngine';

interface VideoPlayerViewProps {
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  initialTime?: number;
}

export const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({ title, videoUrl, initialTime = 0 }) => {
  const router = useRouter();
  const videoRef = useRef<VideoView>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const { isFullscreen, toggleFullscreen, resetToPortrait } = useScreenOrientation();
  const [isFullscreenVideo, setIsFullscreenVideo] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [quality, setQuality] = useState<VideoQualityValue>('auto');

  const {
    player,
    isPlaying,
    isBuffering,
    position,
    duration,
    playbackRate,
    togglePlayPause,
    seekBy,
    seekTo,
    setRate,
  } = useVideoEngine(videoUrl, title);

  const effectiveFullscreen = isFullscreen || isFullscreenVideo;

  useEffect(() => () => {
    resetToPortrait();
  }, [resetToPortrait]);

  useEffect(() => {
    if (initialTime > 0 && player) {
      player.currentTime = initialTime;
    }
  }, [player, initialTime]);

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

  const handleBack = async () => {
    if (effectiveFullscreen) {
      setIsFullscreenVideo(false);
      await videoRef.current?.exitFullscreen();
      await toggleFullscreen();
      return;
    }

    router.back();
  };

  const handleToggleFullscreen = async () => {
    if (isLocked) return;

    const nextValue = !effectiveFullscreen;
    setIsFullscreenVideo(nextValue);

    if (nextValue) {
      await videoRef.current?.enterFullscreen();
      await toggleFullscreen();
      return;
    }

    await videoRef.current?.exitFullscreen();
    await toggleFullscreen();
  };

  const handleOpenSettings = () => {
    setSettingsVisible(true);
    setControlsVisible(true);
  };

  return (
    <View style={[styles.container, effectiveFullscreen && styles.fullscreenContainer]}>
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

      <GestureLayer
        onSingleTap={handleToggleControls}
        onDoubleTapLeft={() => handleSeekRelative(-10)}
        onDoubleTapRight={() => handleSeekRelative(10)}
        onSwipeProgress={(direction, delta) => {
          if (isLocked) return;
          if (direction === 'left' || direction === 'right') {
            const target = Math.max(-30, Math.min(30, delta / 18));
            seekTo(Math.max(0, Math.min(duration, position + target)));
          }
        }}
        onSwipeUp={() => setControlsVisible(true)}
        onSwipeDown={() => setControlsVisible(true)}
      >
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} pointerEvents={controlsVisible ? 'auto' : 'none'}>
          <PlayerHeader
            title={title}
            subtitle={quality === 'auto' ? 'Auto quality' : quality}
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
            onToggleMute={() => setIsMuted((prev) => !prev)}
            onToggleFullscreen={handleToggleFullscreen}
            onToggleLock={() => setIsLocked((prev) => !prev)}
            onOpenSettings={handleOpenSettings}
          />
        </Animated.View>
      </GestureLayer>

      <PlayerSettingsSheet
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        currentSpeed={playbackRate}
        currentQuality={quality}
        onSpeedChange={(speed) => {
          setRate(speed);
          setSettingsVisible(false);
        }}
        onQualityChange={(nextQuality) => {
          setQuality(nextQuality);
          setSettingsVisible(false);
        }}
      />
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

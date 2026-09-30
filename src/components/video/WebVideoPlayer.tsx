import React, { useEffect, useImperativeHandle } from 'react';
import { Platform, View } from 'react-native';

import { useWebVideoEngine } from '@/hooks/useWebVideoEngine';

export interface WebVideoPlayerHandle {
  play: () => void;
  pause: () => void;
  seekTo: (time: number) => void;
}

interface WebVideoPlayerProps {
  sourceUri: string;
  isPlaying: boolean;
  position: number;
  playbackRate: number;
  onReady?: () => void;
}

export const WebVideoPlayer = React.forwardRef<WebVideoPlayerHandle, WebVideoPlayerProps>(
  ({ sourceUri, isPlaying, position, playbackRate, onReady }, ref) => {
    const {
      videoRef,
      attachVideo,
      status,
      togglePlayPause,
      seekTo,
    } = useWebVideoEngine(sourceUri);

    useImperativeHandle(ref, () => ({
      play: () => {
        togglePlayPause();
      },
      pause: () => {
        togglePlayPause();
      },
      seekTo: (time: number) => {
        seekTo(time);
      },
    }));

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      video.playbackRate = playbackRate;
    }, [playbackRate, videoRef]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video || status !== 'readyToPlay') return;

      if (Math.abs(video.currentTime - position) > 0.5) {
        video.currentTime = position;
      }
    }, [position, status, videoRef]);

    useEffect(() => {
      togglePlayPause();
    }, [isPlaying, togglePlayPause]);

    if (Platform.OS !== 'web') {
      return null;
    }

    return (
      <View style={{ width: '100%', height: '100%', backgroundColor: '#000' }}>
        <video
          ref={(el) => {
            if (el instanceof HTMLVideoElement) {
              videoRef.current = el;
              attachVideo(el);
              onReady?.();
            }
          }}
          src={sourceUri}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          playsInline
          preload="metadata"
        />
      </View>
    );
  }
);

WebVideoPlayer.displayName = 'WebVideoPlayer';

import { useVideoPlayer } from 'expo-video';
import { useRef } from 'react';

import { Platform } from 'react-native';

import { useVideoEngine } from '@/hooks/useVideoEngine';
import { useWebVideoEngine } from '@/hooks/useWebVideoEngine';

export interface PlatformVideoEngine {
  player: ReturnType<typeof useVideoPlayer> | null;
  isPlaying: boolean;
  isBuffering: boolean;
  position: number;
  duration: number;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  status: 'idle' | 'loading' | 'readyToPlay' | 'error';
  error?: unknown;
  currentSpeedIndex: number;
  togglePlayPause: () => void;
  seekBy: (seconds: number) => void;
  seekTo: (positionSeconds: number) => void;
  setRate: (rate: number) => void;
  setVolume: (level: number) => void;
  toggleMute: () => void;
  cycleSpeed: () => void;
  reset: () => void;
  isWeb: boolean;
  webVideoRef: React.RefObject<{ play: () => void; pause: () => void; seekTo: (time: number) => void } | null>;
}

export const usePlatformVideoEngine = (sourceUri: string, title?: string): PlatformVideoEngine => {
  const native = useVideoEngine(sourceUri, title);
  const web = useWebVideoEngine(sourceUri, title);
  const isWeb = Platform.OS === 'web';

  const webVideoRef = useRef<{ play: () => void; pause: () => void; seekTo: (time: number) => void } | null>(null);

  if (isWeb) {
    return {
      ...web,
      player: null,
      isWeb: true,
      webVideoRef: webVideoRef as any,
    };
  }

  return {
    ...native,
    isWeb: false,
    webVideoRef: webVideoRef as any,
  };
};




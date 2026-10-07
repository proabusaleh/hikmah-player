import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

import type { MediaItem } from '@/types/media';

export const SUPPORTED_AUDIO_FORMATS = [
  'mp3',
  'm4a',
  'wav',
  'aac',
  'ogg',
  'flac',
] as const;

export type AudioFormat = (typeof SUPPORTED_AUDIO_FORMATS)[number];

export const AUDIO_QUALITY_PRESETS = {
  low: { bitrate: 128, label: 'Low (128kbps)' },
  medium: { bitrate: 192, label: 'Medium (192kbps)' },
  high: { bitrate: 320, label: 'High (320kbps)' },
} as const;

export type AudioEventType =
  | 'play'
  | 'pause'
  | 'stop'
  | 'next'
  | 'previous'
  | 'seek'
  | 'error'
  | 'buffering'
  | 'trackEnd'
  | 'queueEnd';

export type AudioEventCallback = (event: AudioEventType, data?: unknown) => void;

class AudioService {
  private player: AudioPlayer | null = null;
  private isInitialized = false;
  private listeners = new Set<AudioEventCallback>();
  private currentUri: string | null = null;
  private volume = 1.0;
  private isMuted = false;
  private rate = 1.0;
  private endMonitor: ReturnType<typeof setInterval> | null = null;
  private endEmittedForUri: string | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (Platform.OS === 'web') {
      this.isInitialized = true;
      if (__DEV__) {
        console.log('[AudioService] Web platform detected; skipping native audio init');
      }
      return;
    }

    try {
      await setAudioModeAsync({
        allowsRecording: false,
        shouldPlayInBackground: true,
        playsInSilentMode: true,
        shouldRouteThroughEarpiece: false,
        interruptionMode: 'doNotMix',
      });
      this.isInitialized = true;
      if (__DEV__) {
        console.log('[AudioService] Initialized successfully');
      }
    } catch (error) {
      console.warn('[AudioService] Initialization failed; continuing in non-native mode:', error);
      this.isInitialized = true;
    }
  }

  addListener(callback: AudioEventCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private emit(event: AudioEventType, data?: unknown): void {
    this.listeners.forEach((cb) => {
      try {
        cb(event, data);
      } catch (error) {
        console.error('[AudioService] Listener error:', error);
      }
    });
  }

  private startEndMonitor(): void {
    this.stopEndMonitor();
    this.endMonitor = setInterval(() => {
      const player = this.player;
      if (!player || !this.currentUri) return;
      try {
        const duration = player.duration ?? 0;
        const position = player.currentTime ?? 0;
        // expo-audio stays paused at the end instead of auto-resetting.
        if (
          duration > 0 &&
          !player.playing &&
          position >= duration - 0.25 &&
          this.endEmittedForUri !== this.currentUri
        ) {
          this.endEmittedForUri = this.currentUri;
          this.emit('trackEnd', {
            position: position * 1000,
            duration: duration * 1000,
          });
        } else if (player.playing) {
          this.endEmittedForUri = null;
        }
      } catch {
        // Ignore polling errors.
      }
    }, 500);
  }

  private stopEndMonitor(): void {
    if (this.endMonitor) {
      clearInterval(this.endMonitor);
      this.endMonitor = null;
    }
  }

  private applyPersistedSettings(): void {
    if (!this.player) return;
    try {
      this.player.volume = this.volume;
      this.player.muted = this.isMuted;
      this.player.setPlaybackRate(this.rate);
    } catch {
      // Ignore: player may not be ready yet.
    }
  }

  async loadTrack(item: MediaItem, autoPlay = true): Promise<{ duration: number }> {
    await this.initialize();

    try {
      await this.unload();

      this.emit('buffering');
      this.currentUri = item.url;
      this.endEmittedForUri = null;

      this.player = createAudioPlayer({ uri: item.url }, { updateInterval: 250 });
      this.player.loop = false;
      this.applyPersistedSettings();

      if (autoPlay) {
        this.player.play();
        this.emit('play');
      }

      this.startEndMonitor();

      const rawDuration = this.player.duration ?? 0;
      const duration = Number.isFinite(rawDuration) ? rawDuration * 1000 : 0;
      return { duration };
    } catch (error) {
      console.error('[AudioService] Load failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async play(): Promise<void> {
    if (!this.player) return;
    try {
      const duration = this.player.duration ?? 0;
      const position = this.player.currentTime ?? 0;
      // expo-audio does not auto-reset on finish: rewind first when at the end.
      if (duration > 0 && position >= duration - 0.25) {
        await this.player.seekTo(0);
        this.endEmittedForUri = null;
      }
      this.player.play();
      this.emit('play');
    } catch (error) {
      console.error('[AudioService] Play failed:', error);
      this.emit('error', error);
    }
  }

  async pause(): Promise<void> {
    if (!this.player) return;
    try {
      this.player.pause();
      this.emit('pause');
    } catch (error) {
      console.error('[AudioService] Pause failed:', error);
    }
  }

  async stop(): Promise<void> {
    if (!this.player) return;
    try {
      this.player.pause();
      await this.player.seekTo(0);
      this.endEmittedForUri = null;
      this.emit('stop');
    } catch (error) {
      console.error('[AudioService] Stop failed:', error);
    }
  }

  async seek(positionMs: number): Promise<void> {
    if (!this.player) return;
    try {
      await this.player.seekTo(Math.max(0, positionMs) / 1000);
      this.endEmittedForUri = null;
      this.emit('seek', { position: positionMs });
    } catch (error) {
      console.error('[AudioService] Seek failed:', error);
    }
  }

  async seekRelative(deltaMs: number): Promise<void> {
    if (!this.player) return;
    try {
      const position = (this.player.currentTime ?? 0) * 1000;
      const duration = (this.player.duration ?? 0) * 1000;
      const target = Math.max(0, Math.min(position + deltaMs, duration));
      await this.seek(target);
    } catch (error) {
      console.error('[AudioService] Relative seek failed:', error);
    }
  }

  async setRate(rate: number, _shouldCorrectPitch = true): Promise<void> {
    if (!this.player) {
      this.rate = Math.max(0.25, Math.min(4.0, rate));
      return;
    }
    const clampedRate = Math.max(0.25, Math.min(4.0, rate));
    this.rate = clampedRate;
    try {
      this.player.setPlaybackRate(clampedRate);
    } catch (error) {
      console.error('[AudioService] Set rate failed:', error);
    }
  }

  async setVolume(volume: number): Promise<void> {
    const clamped = Math.max(0, Math.min(1, volume));
    this.volume = clamped;
    if (!this.player) return;
    try {
      this.player.volume = clamped;
    } catch (error) {
      console.error('[AudioService] Set volume failed:', error);
    }
  }

  async setMuted(isMuted: boolean): Promise<void> {
    this.isMuted = isMuted;
    if (!this.player) return;
    try {
      this.player.muted = isMuted;
    } catch (error) {
      console.error('[AudioService] Set muted failed:', error);
    }
  }

  async getStatus(): Promise<{
    isPlaying: boolean;
    position: number;
    duration: number;
    isBuffering: boolean;
    rate: number;
    volume: number;
    isMuted: boolean;
  } | null> {
    if (!this.player) return null;

    try {
      // Native currentTime/duration can be NaN before metadata loads
      // (common on web). Coerce to 0 so the progress bar gets sane values.
      const rawPosition = this.player.currentTime ?? 0;
      const rawDuration = this.player.duration ?? 0;
      return {
        isPlaying: this.player.playing,
        position: Number.isFinite(rawPosition) ? rawPosition * 1000 : 0,
        duration: Number.isFinite(rawDuration) ? rawDuration * 1000 : 0,
        isBuffering: this.player.isBuffering ?? false,
        rate: this.player.playbackRate ?? this.rate,
        volume: this.player.volume ?? this.volume,
        isMuted: this.player.muted ?? this.isMuted,
      };
    } catch {
      return null;
    }
  }

  async unload(): Promise<void> {
    this.stopEndMonitor();
    this.endEmittedForUri = null;
    if (this.player) {
      try {
        this.player.remove();
      } catch {
        // Ignore unload errors.
      }
      this.player = null;
      this.currentUri = null;
    }
  }

  async destroy(): Promise<void> {
    await this.unload();
    this.listeners.clear();
    this.isInitialized = false;
  }
}

export const audioService = new AudioService();

import { Audio, AVPlaybackStatus, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
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
  private sound: Audio.Sound | null = null;
  private isInitialized = false;
  private listeners = new Set<AudioEventCallback>();
  private currentUri: string | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (Platform.OS === 'web') {
      this.isInitialized = true;
      console.log('[AudioService] Web platform detected; skipping native audio init');
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: InterruptionModeIOS.DoNotMix,
        interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      });
      this.isInitialized = true;
      console.log('[AudioService] Initialized successfully');
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

  private onPlaybackStatusUpdate = (status: AVPlaybackStatus): void => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error(`[AudioService] Playback error: ${status.error}`);
        this.emit('error', status.error);
      }
      return;
    }

    if (status.didJustFinish) {
      this.emit('trackEnd', {
        position: status.positionMillis,
        duration: status.durationMillis,
      });
      return;
    }

    if (status.isBuffering) {
      this.emit('buffering', {
        position: status.positionMillis,
        duration: status.durationMillis,
      });
    }
  };

  async loadTrack(item: MediaItem, autoPlay = true): Promise<{ duration: number }> {
    await this.initialize();

    try {
      await this.unload();

      this.emit('buffering');
      this.currentUri = item.url;

      const { sound, status } = await Audio.Sound.createAsync(
        { uri: item.url },
        {
          shouldPlay: autoPlay,
          progressUpdateIntervalMillis: 250,
          rate: 1.0,
          shouldCorrectPitch: true,
        },
        this.onPlaybackStatusUpdate
      );

      this.sound = sound;

      if (autoPlay) this.emit('play');

      const duration = status.isLoaded ? status.durationMillis || 0 : 0;
      return { duration };
    } catch (error) {
      console.error('[AudioService] Load failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  async play(): Promise<void> {
    if (!this.sound) return;
    await this.sound.playAsync();
    this.emit('play');
  }

  async pause(): Promise<void> {
    if (!this.sound) return;
    await this.sound.pauseAsync();
    this.emit('pause');
  }

  async stop(): Promise<void> {
    if (!this.sound) return;
    await this.sound.stopAsync();
    this.emit('stop');
  }

  async seek(positionMs: number): Promise<void> {
    if (!this.sound) return;
    await this.sound.setPositionAsync(Math.max(0, positionMs));
    this.emit('seek', { position: positionMs });
  }

  async seekRelative(deltaMs: number): Promise<void> {
    if (!this.sound) return;
    const status = await this.sound.getStatusAsync();
    if (status.isLoaded) {
      const target = Math.max(
        0,
        Math.min(status.positionMillis + deltaMs, status.durationMillis || 0)
      );
      await this.seek(target);
    }
  }

  async setRate(rate: number, shouldCorrectPitch = true): Promise<void> {
    if (!this.sound) return;
    const clampedRate = Math.max(0.25, Math.min(4.0, rate));
    await this.sound.setRateAsync(clampedRate, shouldCorrectPitch);
  }

  async setVolume(volume: number): Promise<void> {
    if (!this.sound) return;
    const clamped = Math.max(0, Math.min(1, volume));
    await this.sound.setVolumeAsync(clamped);
  }

  async setMuted(isMuted: boolean): Promise<void> {
    if (!this.sound) return;
    await this.sound.setIsMutedAsync(isMuted);
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
    if (!this.sound) return null;

    const status = await this.sound.getStatusAsync();
    if (!status.isLoaded) return null;

    return {
      isPlaying: status.isPlaying,
      position: status.positionMillis,
      duration: status.durationMillis || 0,
      isBuffering: status.isBuffering,
      rate: status.rate,
      volume: status.volume,
      isMuted: status.isMuted,
    };
  }

  async unload(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch {
        // Ignore unload errors.
      }
      this.sound = null;
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

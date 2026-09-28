import { Audio, AVPlaybackStatus } from 'expo-av';

import { MediaItem, PlaybackStatus } from '@/types/media';

import { configureAudioEngine } from './audioEngine';

type StatusUpdateCallback = (
  status: PlaybackStatus,
  position: number,
  duration: number
) => void;

class AudioController {
  private soundInstance: Audio.Sound | null = null;
  private onStatusUpdateCallback: StatusUpdateCallback | null = null;
  private currentUrl: string | null = null;

  constructor() {
    configureAudioEngine();
  }

  public setStatusUpdateListener(callback: StatusUpdateCallback) {
    this.onStatusUpdateCallback = callback;
  }

  private handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.error(`[AudioController] Error: ${status.error}`);
        this.onStatusUpdateCallback?.('error', 0, 0);
      }
      return;
    }

    const duration = status.durationMillis || 0;
    const position = status.positionMillis || 0;

    if (status.didJustFinish) {
      this.onStatusUpdateCallback?.('stopped', duration, duration);
      return;
    }

    if (status.isBuffering) {
      this.onStatusUpdateCallback?.('buffering', position, duration);
    } else if (status.isPlaying) {
      this.onStatusUpdateCallback?.('playing', position, duration);
    } else {
      this.onStatusUpdateCallback?.('paused', position, duration);
    }
  };

  public async loadAndPlay(item: MediaItem): Promise<void> {
    try {
      if (this.soundInstance) {
        await this.soundInstance.unloadAsync();
        this.soundInstance.setOnPlaybackStatusUpdate(null);
        this.soundInstance = null;
      }

      this.onStatusUpdateCallback?.('buffering', 0, 0);
      this.currentUrl = item.url;

      const { sound } = await Audio.Sound.createAsync(
        { uri: item.url },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        this.handlePlaybackStatusUpdate
      );

      this.soundInstance = sound;
    } catch (error) {
      console.error('[AudioController] Failed to load media:', error);
      this.onStatusUpdateCallback?.('error', 0, 0);
    }
  }

  public async play(): Promise<void> {
    if (this.soundInstance) {
      await this.soundInstance.playAsync();
    }
  }

  public async pause(): Promise<void> {
    if (this.soundInstance) {
      await this.soundInstance.pauseAsync();
    }
  }

  public async seek(positionMs: number): Promise<void> {
    if (this.soundInstance) {
      await this.soundInstance.setPositionAsync(positionMs);
    }
  }

  public async setRate(speed: number): Promise<void> {
    if (this.soundInstance) {
      await this.soundInstance.setRateAsync(speed, true);
    }
  }

  public async unload(): Promise<void> {
    if (this.soundInstance) {
      await this.soundInstance.unloadAsync();
      this.soundInstance = null;
      this.currentUrl = null;
    }
  }
}

export const audioController = new AudioController();

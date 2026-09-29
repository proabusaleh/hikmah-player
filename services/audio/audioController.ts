import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

import { MediaItem, PlaybackStatus } from '@/types/media';

import { configureAudioEngine } from './audioEngine';

type StatusUpdateCallback = (
  status: PlaybackStatus,
  position: number,
  duration: number
) => void;

class AudioController {
  private player: AudioPlayer | null = null;
  private onStatusUpdateCallback: StatusUpdateCallback | null = null;
  private currentUrl: string | null = null;
  private endMonitor: ReturnType<typeof setInterval> | null = null;

  constructor() {
    void configureAudioEngine();
  }

  public setStatusUpdateListener(callback: StatusUpdateCallback) {
    this.onStatusUpdateCallback = callback;
  }

  private startEndMonitor(): void {
    this.stopEndMonitor();
    this.endMonitor = setInterval(() => {
      const player = this.player;
      if (!player) return;
      try {
        const duration = (player.duration ?? 0) * 1000;
        const position = (player.currentTime ?? 0) * 1000;
        if (duration <= 0) return;
        if (!player.playing && position >= duration - 250) {
          this.onStatusUpdateCallback?.('stopped', duration, duration);
          this.stopEndMonitor();
        } else if (player.isBuffering) {
          this.onStatusUpdateCallback?.('buffering', position, duration);
        } else if (player.playing) {
          this.onStatusUpdateCallback?.('playing', position, duration);
        } else {
          this.onStatusUpdateCallback?.('paused', position, duration);
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

  public async loadAndPlay(item: MediaItem): Promise<void> {
    try {
      if (this.player) {
        try {
          this.player.remove();
        } catch {
          // Ignore unload errors.
        }
        this.player = null;
      }
      this.stopEndMonitor();

      this.onStatusUpdateCallback?.('buffering', 0, 0);
      this.currentUrl = item.url;

      this.player = createAudioPlayer({ uri: item.url }, { updateInterval: 500 });
      this.player.loop = false;
      this.player.play();
      this.startEndMonitor();
    } catch (error) {
      console.error('[AudioController] Failed to load media:', error);
      this.onStatusUpdateCallback?.('error', 0, 0);
    }
  }

  public async play(): Promise<void> {
    if (!this.player) return;
    try {
      const duration = this.player.duration ?? 0;
      const position = this.player.currentTime ?? 0;
      if (duration > 0 && position >= duration - 0.25) {
        await this.player.seekTo(0);
      }
      this.player.play();
    } catch (error) {
      console.error('[AudioController] Play failed:', error);
    }
  }

  public async pause(): Promise<void> {
    if (!this.player) return;
    try {
      this.player.pause();
    } catch (error) {
      console.error('[AudioController] Pause failed:', error);
    }
  }

  public async seek(positionMs: number): Promise<void> {
    if (!this.player) return;
    try {
      await this.player.seekTo(Math.max(0, positionMs) / 1000);
    } catch (error) {
      console.error('[AudioController] Seek failed:', error);
    }
  }

  public async setRate(speed: number): Promise<void> {
    if (!this.player) return;
    try {
      this.player.setPlaybackRate(Math.max(0.25, Math.min(4.0, speed)));
    } catch (error) {
      console.error('[AudioController] Set rate failed:', error);
    }
  }

  public async unload(): Promise<void> {
    this.stopEndMonitor();
    if (this.player) {
      try {
        this.player.remove();
      } catch {
        // Ignore unload errors.
      }
      this.player = null;
      this.currentUrl = null;
    }
  }
}

export const audioController = new AudioController();

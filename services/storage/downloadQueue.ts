import * as FileSystem from 'expo-file-system/legacy';

import { MediaItem } from '@/types/media';

import { StorageService } from './storageService';

// ─── Download Task ───────────────────────────────────
export interface DownloadTask {
  id: string;
  item: MediaItem;
  status: 'queued' | 'downloading' | 'paused' | 'completed' | 'failed';
  progress: number; // 0 to 1
  bytesDownloaded: number;
  totalBytes: number;
  retries: number;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

// ─── Queue Config ────────────────────────────────────
const QUEUE_KEY = '@hikmah_download_queue';
const MAX_CONCURRENT = 2; // Max parallel downloads
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

class DownloadQueue {
  private tasks: Map<string, DownloadTask> = new Map();
  private activeDownloads: Set<string> = new Set();
  private downloadResumables: Map<string, FileSystem.DownloadResumable> = new Map();
  private isProcessing = false;

  /**
   * Load persisted queue from storage
   */
  async initialize(): Promise<void> {
    const saved = await StorageService.getItem<DownloadTask[]>(QUEUE_KEY);
    if (saved) {
      for (const task of saved) {
        // Reset any "downloading" tasks to "queued" (app was killed)
        if (task.status === 'downloading') {
          task.status = 'queued';
          task.progress = 0;
        }
        this.tasks.set(task.id, task);
      }
    }
    void this.processQueue();
  }

  /**
   * Add items to download queue
   */
  async enqueue(items: MediaItem[]): Promise<void> {
    for (const item of items) {
      if (this.tasks.has(item.id)) continue;

      const task: DownloadTask = {
        id: item.id,
        item,
        status: 'queued',
        progress: 0,
        bytesDownloaded: 0,
        totalBytes: 0,
        retries: 0,
        createdAt: Date.now(),
      };

      this.tasks.set(item.id, task);
    }

    await this.persistQueue();
    void this.processQueue();
  }

  /**
   * Pause a specific download
   */
  async pauseDownload(taskId: string): Promise<void> {
    const resumable = this.downloadResumables.get(taskId);
    if (resumable) {
      await resumable.pauseAsync();
      this.downloadResumables.delete(taskId);
    }

    const task = this.tasks.get(taskId);
    if (task) {
      task.status = 'paused';
      this.activeDownloads.delete(taskId);
    }

    await this.persistQueue();
    void this.processQueue();
  }

  /**
   * Resume a paused download
   */
  async resumeDownload(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (task && task.status === 'paused') {
      task.status = 'queued';
      await this.persistQueue();
      void this.processQueue();
    }
  }

  /**
   * Cancel and remove a download
   */
  async cancelDownload(taskId: string): Promise<void> {
    const resumable = this.downloadResumables.get(taskId);
    if (resumable) {
      await resumable.pauseAsync();
      this.downloadResumables.delete(taskId);
    }

    this.activeDownloads.delete(taskId);
    this.tasks.delete(taskId);
    await this.persistQueue();
    void this.processQueue();
  }

  /**
   * Process the queue (start next downloads if slots available)
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.activeDownloads.size < MAX_CONCURRENT) {
        const nextTask = this.getNextQueuedTask();
        if (!nextTask) break;

        this.activeDownloads.add(nextTask.id);
        nextTask.status = 'downloading';
        nextTask.startedAt = Date.now();
        await this.startDownload(nextTask);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get the next queued task (FIFO)
   */
  private getNextQueuedTask(): DownloadTask | null {
    for (const task of this.tasks.values()) {
      if (task.status === 'queued') return task;
    }
    return null;
  }

  /**
   * Execute a single download with retry logic
   */
  private async startDownload(task: DownloadTask): Promise<void> {
    const ext = task.item.type === 'video' ? 'mp4' : 'mp3';
    const localUri = `${FileSystem.documentDirectory}hikmah_media/${task.id}_${Date.now()}.${ext}`;

    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}hikmah_media/`);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}hikmah_media/`, {
        intermediates: true,
      });
    }

    try {
      const resumable = FileSystem.createDownloadResumable(task.item.url, localUri, {}, (progress) => {
        if (progress.totalBytesExpectedToWrite > 0) {
          task.progress = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
        }
        task.bytesDownloaded = progress.totalBytesWritten;
        task.totalBytes = progress.totalBytesExpectedToWrite;
        // Throttle UI updates
        this.throttledNotify(task.id);
      });

      this.downloadResumables.set(task.id, resumable);
      const result = await resumable.downloadAsync();
      this.downloadResumables.delete(task.id);

      if (result?.uri) {
        task.status = 'completed';
        task.progress = 1;
        task.completedAt = Date.now();

        // Update item URL to local path
        task.item.url = result.uri;
        task.item.isLocal = true;
      } else {
        throw new Error('Download returned no URI');
      }
    } catch (error) {
      this.downloadResumables.delete(task.id);
      const message = error instanceof Error ? error.message : 'Download failed';

      if (task.retries < MAX_RETRIES) {
        task.retries++;
        task.status = 'queued';
        task.error = `Retry ${task.retries}/${MAX_RETRIES}`;
        console.warn(`[DownloadQueue] Retrying ${task.id}: ${message}`);

        // Delay before retry
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        task.status = 'failed';
        task.error = message;
        console.error(`[DownloadQueue] Failed ${task.id}: ${message}`);
      }
    }

    this.activeDownloads.delete(task.id);
    await this.persistQueue();
    void this.processQueue(); // Start next in queue
  }

  // ── Throttled UI Notification ──
  private notifyTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  private throttledNotify(taskId: string): void {
    if (this.notifyTimers.has(taskId)) return;

    this.notifyTimers.set(
      taskId,
      setTimeout(() => {
        this.notifyTimers.delete(taskId);
        // In production, emit event to store
      }, 500) // Max 2 UI updates per second
    );
  }

  // ── Persistence ──
  private async persistQueue(): Promise<void> {
    const tasks = Array.from(this.tasks.values());
    await StorageService.setItem(QUEUE_KEY, tasks);
  }

  // ── Public Getters ──
  getAllTasks(): DownloadTask[] {
    return Array.from(this.tasks.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  getActiveCount(): number {
    return this.activeDownloads.size;
  }

  getQueuedCount(): number {
    return Array.from(this.tasks.values()).filter((t) => t.status === 'queued').length;
  }

  getCompletedCount(): number {
    return Array.from(this.tasks.values()).filter((t) => t.status === 'completed').length;
  }
}

export const downloadQueue = new DownloadQueue();

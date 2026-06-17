import { uploadConfig } from '../../config/upload';
import {
  getNextRetryDelayMs,
  recoverInterruptedUploads,
  selectNextUploadCandidate,
} from '../../db/uploadRepository';
import { uploadSingleVideo } from './uploadSingleVideo';

type QueueListener = () => void;

class UploadQueueWorker {
  private processing = false;
  private stopped = true;
  private scheduledTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<QueueListener>();

  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  async initialize(): Promise<void> {
    await recoverInterruptedUploads();
  }

  start(): void {
    this.stopped = false;
    void this.pump();
  }

  stop(): void {
    this.stopped = true;
    if (this.scheduledTimer) {
      clearTimeout(this.scheduledTimer);
      this.scheduledTimer = null;
    }
  }

  wake(): void {
    if (!this.stopped) {
      void this.pump();
    }
  }

  private schedule(delayMs: number): void {
    if (this.stopped) {
      return;
    }

    if (this.scheduledTimer) {
      clearTimeout(this.scheduledTimer);
    }

    this.scheduledTimer = setTimeout(() => {
      this.scheduledTimer = null;
      void this.pump();
    }, delayMs);
  }

  private async pump(): Promise<void> {
    if (this.stopped || this.processing) {
      return;
    }

    this.processing = true;

    try {
      const candidate = await selectNextUploadCandidate();

      if (!candidate) {
        const retryDelay = await getNextRetryDelayMs();
        this.schedule(retryDelay ?? uploadConfig.queuePollIntervalMs);
        return;
      }

      await uploadSingleVideo(candidate);
      this.notify();

      if (!this.stopped) {
        this.schedule(250);
      }
    } finally {
      this.processing = false;
    }
  }
}

export const uploadQueueWorker = new UploadQueueWorker();

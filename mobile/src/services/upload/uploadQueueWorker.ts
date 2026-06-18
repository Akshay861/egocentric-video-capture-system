import NetInfo from '@react-native-community/netinfo';

import { uploadConfig } from '../../config/upload';
import {
  getNextRetryDelayMs,
  recoverInterruptedUploads,
  selectNextUploadCandidate,
} from '../../db/uploadRepository';
import { uploadSingleVideo } from './uploadSingleVideo';

export type UploadQueueSnapshot = {
  preparingVideoId: string | null;
  uploadingVideoId: string | null;
};

type QueueListener = () => void;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

class UploadQueueWorker {
  private processing = false;
  private stopped = true;
  private activeWorkerId: string | null = null;
  private preparingVideoId: string | null = null;
  private uploadingVideoId: string | null = null;
  private scheduledTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<QueueListener>();

  subscribe(listener: QueueListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): UploadQueueSnapshot {
    return {
      preparingVideoId: this.preparingVideoId,
      uploadingVideoId: this.uploadingVideoId,
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private setPreparingVideoId(videoId: string | null): void {
    this.preparingVideoId = videoId;
    this.notify();
  }

  async initialize(): Promise<void> {
    await recoverInterruptedUploads();
  }

  setWorkerId(workerId: string | null): void {
    this.activeWorkerId = workerId;
    if (workerId && !this.stopped) {
      void this.pump();
    }
  }

  start(): void {
    this.stopped = false;
    void this.pump();
  }

  stop(): void {
    this.stopped = true;
    this.preparingVideoId = null;
    this.uploadingVideoId = null;
    this.notify();
    if (this.scheduledTimer) {
      clearTimeout(this.scheduledTimer);
      this.scheduledTimer = null;
    }
  }

  wake(): void {
    if (!this.stopped && this.activeWorkerId) {
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
    if (this.stopped || this.processing || !this.activeWorkerId) {
      return;
    }

    this.processing = true;

    try {
      const network = await NetInfo.fetch();
      if (!network.isConnected) {
        this.schedule(uploadConfig.queuePollIntervalMs);
        return;
      }

      const candidate = await selectNextUploadCandidate(this.activeWorkerId);

      if (!candidate) {
        this.preparingVideoId = null;
        this.uploadingVideoId = null;
        this.notify();
        const retryDelay = await getNextRetryDelayMs(this.activeWorkerId);
        this.schedule(retryDelay ?? uploadConfig.queuePollIntervalMs);
        return;
      }

      this.setPreparingVideoId(candidate.videoId);
      await sleep(uploadConfig.preparingDelayMs);

      if (this.stopped || this.preparingVideoId !== candidate.videoId) {
        return;
      }

      await uploadSingleVideo(candidate, {
        onUploading: () => {
          this.preparingVideoId = null;
          this.uploadingVideoId = candidate.videoId;
          this.notify();
        },
      });

      this.uploadingVideoId = null;
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

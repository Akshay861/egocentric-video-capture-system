import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { File } from 'expo-file-system';

import { CloudStatusBadge, LocalStatusBadge } from './StatusBadges';
import { VideoPlayerModal } from './VideoPlayerModal';
import { VideoThumbnail } from './VideoThumbnail';
import type { VideoRecord } from '../types/video';
import { formatDurationMs, formatFileSize } from '../utils/format';
import {
  canRetryUpload,
  isQueueBusy,
  resolveCloudDisplayState,
  type LocalStorageState,
} from '../utils/uploadState';
import { showConfirm } from '../utils/showAlert';
import { userMessages } from '../utils/userMessages';

type VideoListItemProps = {
  video: VideoRecord;
  allVideos: VideoRecord[];
  preparingVideoId: string | null;
  uploadingVideoId: string | null;
  onRetry: (videoId: string) => void;
  onDelete: (videoId: string) => void;
  busyVideoId: string | null;
};

export function VideoListItem({
  video,
  allVideos,
  preparingVideoId,
  uploadingVideoId,
  onRetry,
  onDelete,
  busyVideoId,
}: VideoListItemProps) {
  const [playerVisible, setPlayerVisible] = useState(false);
  const [showFailureMessage, setShowFailureMessage] = useState(false);
  const isBusy = busyVideoId === video.videoId;

  const localState: LocalStorageState = useMemo(() => {
    return new File(video.localPath).exists ? 'saved' : 'missing';
  }, [video.localPath]);

  const queueIsBusy = isQueueBusy(allVideos, preparingVideoId, uploadingVideoId);
  const cloudState = resolveCloudDisplayState(
    video.uploadState,
    video.videoId,
    preparingVideoId,
    uploadingVideoId,
    queueIsBusy
  );

  const showRetry = canRetryUpload(video.uploadState);
  const canDelete = video.uploadState !== 'uploading' && cloudState !== 'preparing';
  const recordedLabel = new Date(video.startedAt).toLocaleString();
  const shortId = video.videoId.slice(0, 8);

  useEffect(() => {
    if (video.uploadState !== 'failed') {
      setShowFailureMessage(false);
      return;
    }

    setShowFailureMessage(true);
    const timer = setTimeout(() => {
      setShowFailureMessage(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [video.uploadState, video.attemptCount, video.lastAttemptedAt]);

  const confirmDelete = () => {
    showConfirm(
      userMessages.library.deleteConfirmTitle,
      userMessages.library.deleteConfirmBody,
      () => onDelete(video.videoId),
      { confirmLabel: 'Delete', destructive: true }
    );
  };

  return (
    <>
      <View style={styles.card}>
        <VideoThumbnail
          videoUri={video.localPath}
          durationLabel={formatDurationMs(video.durationMs)}
          onPlay={() => setPlayerVisible(true)}
        />

        <View style={styles.body}>
          <Text style={styles.title}>Recording {shortId}</Text>
          <Text style={styles.subtitle}>{video.deviceModel} · Android {video.osVersion}</Text>
          <Text style={styles.description}>
            {formatFileSize(video.fileSizeBytes)} · {video.resolution} · FPS tier {video.fpsTier}
          </Text>
          <Text style={styles.recordedAt}>{recordedLabel}</Text>

          <View style={styles.statusRow}>
            <LocalStatusBadge state={localState} />
            <CloudStatusBadge state={cloudState} />
          </View>

          {showFailureMessage ? (
            <Text style={styles.error}>{userMessages.library.cloudFailedInline}</Text>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.actions}>
            {showRetry ? (
              <Pressable
                style={[styles.retryButton, isBusy && styles.disabled]}
                onPress={() => onRetry(video.videoId)}
                disabled={isBusy}
              >
                {isBusy ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.retryText}>
                    {video.uploadState === 'failed'
                      ? userMessages.upload.retryFailed
                      : userMessages.upload.uploadNow}
                  </Text>
                )}
              </Pressable>
            ) : null}

            {canDelete ? (
              <Pressable
                style={[styles.deleteButton, isBusy && styles.disabled]}
                onPress={confirmDelete}
                disabled={isBusy}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <VideoPlayerModal
        visible={playerVisible}
        videoUri={video.localPath}
        title={`Recording ${shortId}`}
        onClose={() => setPlayerVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F2937',
    marginBottom: 16,
    overflow: 'hidden',
  },
  body: {
    padding: 16,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  description: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  recordedAt: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  error: {
    color: '#FCA5A5',
    fontSize: 13,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#1F2937',
    marginVertical: 12,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 140,
    alignItems: 'center',
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#B91C1C',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  deleteText: {
    color: '#FCA5A5',
    fontWeight: '600',
    fontSize: 14,
  },
  disabled: {
    opacity: 0.6,
  },
});

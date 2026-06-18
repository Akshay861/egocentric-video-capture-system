import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { VideoListItem } from '../components/VideoListItem';
import { appBranding } from '../config/branding';
import { useAuth } from '../context/AuthContext';
import { useUploadQueueSnapshot } from '../hooks/useUploadQueueSnapshot';
import { countVideosByWorker, getLatestVideosByWorker } from '../db/videoRepository';
import { uploadQueueWorker } from '../services/upload/uploadQueueWorker';
import { retryUpload } from '../services/upload/uploadActions';
import { deleteVideoAndLocalFile } from '../services/video/deleteVideo';
import type { VideoRecord } from '../types/video';
import { showAlert } from '../utils/showAlert';
import { toUserMessage, userMessages } from '../utils/userMessages';

const PAGE_SIZE = 10;

type VideoDashboardScreenProps = {
  onBack: () => void;
};

export function VideoDashboardScreen({ onBack }: VideoDashboardScreenProps) {
  const { workerId } = useAuth();
  const { preparingVideoId, uploadingVideoId } = useUploadQueueSnapshot();
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyVideoId, setBusyVideoId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const hasMore = videos.length < totalCount;

  const loadPage = useCallback(
    async (nextOffset: number, replace: boolean) => {
      if (!workerId) {
        setVideos([]);
        setTotalCount(0);
        return;
      }

      try {
        const [page, total] = await Promise.all([
          getLatestVideosByWorker(workerId, PAGE_SIZE, nextOffset),
          countVideosByWorker(workerId),
        ]);

        setTotalCount(total);
        setVideos((current) => (replace ? page : [...current, ...page]));
        setOffset(nextOffset + page.length);
        setLoadError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : userMessages.library.loadFailed;
        setLoadError(toUserMessage(error, userMessages.library.loadFailed));
        throw new Error(message);
      }
    },
    [workerId]
  );

  const refresh = useCallback(async () => {
    if (!workerId) {
      return;
    }

    setRefreshing(true);
    try {
      await loadPage(0, true);
    } finally {
      setRefreshing(false);
    }
  }, [loadPage, workerId]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await loadPage(0, true);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadPage]);

  useEffect(() => {
    const unsubscribe = uploadQueueWorker.subscribe(() => {
      void refresh();
    });

    return unsubscribe;
  }, [refresh]);

  const loadMore = async () => {
    if (!hasMore || loadingMore || loading) {
      return;
    }

    setLoadingMore(true);
    try {
      await loadPage(offset, false);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRetry = async (videoId: string) => {
    setBusyVideoId(videoId);
    try {
      const retried = await retryUpload(videoId);
      if (!retried) {
        showAlert(
          userMessages.library.uploadUnavailableTitle,
          userMessages.library.uploadUnavailableBody
        );
        return;
      }

      await refresh();
    } catch (error) {
      showAlert(
        userMessages.library.uploadFailedTitle,
        toUserMessage(error, userMessages.library.loadFailed)
      );
    } finally {
      setBusyVideoId(null);
    }
  };

  const handleDelete = async (videoId: string) => {
    setBusyVideoId(videoId);
    try {
      await deleteVideoAndLocalFile(videoId);
      await refresh();
    } catch (error) {
      showAlert(
        userMessages.library.deleteFailedTitle,
        toUserMessage(error, 'We could not delete this recording. Please try again.')
      );
    } finally {
      setBusyVideoId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Text style={styles.appName}>{appBranding.name}</Text>
        <Text style={styles.title}>{appBranding.libraryTitle}</Text>
        <Text style={styles.subtitle}>
          {totalCount} recording{totalCount === 1 ? '' : 's'} · showing {videos.length}
        </Text>
        {loadError ? <Text style={styles.errorBanner}>{loadError}</Text> : null}
      </View>

      <FlatList
        data={videos}
        keyExtractor={(item) => item.videoId}
        renderItem={({ item }) => (
          <VideoListItem
            video={item}
            allVideos={videos}
            preparingVideoId={preparingVideoId}
            uploadingVideoId={uploadingVideoId}
            onRetry={(videoId) => void handleRetry(videoId)}
            onDelete={(videoId) => void handleDelete(videoId)}
            busyVideoId={busyVideoId}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor="#FFFFFF" />
        }
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          <Text style={styles.empty}>{userMessages.library.empty}</Text>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color="#FFFFFF" style={styles.footerLoader} />
          ) : hasMore ? (
            <Text style={styles.footerText}>Scroll for more...</Text>
          ) : videos.length > 0 ? (
            <Text style={styles.footerText}>End of list</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B1220',
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backText: {
    color: '#F9FAFB',
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  appName: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  errorBanner: {
    marginTop: 8,
    color: '#FCA5A5',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  empty: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 22,
  },
  footerLoader: {
    marginVertical: 16,
  },
  footerText: {
    color: '#6B7280',
    textAlign: 'center',
    marginVertical: 16,
  },
});

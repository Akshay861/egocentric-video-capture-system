import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';

type VideoThumbnailProps = {
  videoUri: string;
  durationLabel: string;
  onPlay: () => void;
};

export function VideoThumbnail({ videoUri, durationLabel, onPlay }: VideoThumbnailProps) {
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await VideoThumbnails.getThumbnailAsync(videoUri, { time: 500 });
        if (!cancelled) {
          setThumbnailUri(result.uri);
        }
      } catch {
        if (!cancelled) {
          setThumbnailUri(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [videoUri]);

  return (
    <View style={styles.container}>
      {thumbnailUri ? (
        <Image source={{ uri: thumbnailUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          {loading ? <ActivityIndicator color="#C4B5FD" /> : <Text style={styles.placeholderText}>No preview</Text>}
        </View>
      )}

      <View style={styles.durationPill}>
        <Text style={styles.durationText}>{durationLabel}</Text>
      </View>

      <Pressable style={styles.playButton} onPress={onPlay}>
        <Text style={styles.playIcon}>▶</Text>
        <Text style={styles.playText}>Play</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 180,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
  durationPill: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  durationText: {
    color: '#F9FAFB',
    fontSize: 12,
    fontWeight: '600',
  },
  playButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  playIcon: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  playText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

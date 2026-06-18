import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

type VideoPlayerModalProps = {
  visible: boolean;
  videoUri: string;
  title: string;
  onClose: () => void;
};

function VideoPlayerContent({ videoUri }: { videoUri: string }) {
  const player = useVideoPlayer(videoUri, (instance) => {
    instance.loop = false;
    instance.play();
  });

  return <VideoView style={styles.player} player={player} nativeControls contentFit="contain" />;
}

export function VideoPlayerModal({ visible, videoUri, title, onClose }: VideoPlayerModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>

        {visible ? <VideoPlayerContent videoUri={videoUri} /> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  closeButton: {
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeText: {
    color: '#F9FAFB',
    fontWeight: '600',
  },
  player: {
    flex: 1,
  },
});

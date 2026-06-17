import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import type { CameraType } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { v4 as uuidv4 } from 'uuid';

import { useAuth } from '../context/AuthContext';
import { env } from '../config/env';
import { completeRecording } from '../services/capture/completeRecording';
import { collectRecordingStartMetadata } from '../services/capture/metadataCollector';
import { RECORDING_VIDEO_QUALITY } from '../services/capture/recordingConfig';
import type { RecordingStartMetadata } from '../services/capture/metadataCollector';
import { formatRecordingTimer } from '../utils/time';

type CapturePhase = 'idle' | 'recording' | 'saving';

type CaptureScreenProps = {
  onBack: () => void;
};

export function CaptureScreen({ onBack }: CaptureScreenProps) {
  const { workerId } = useAuth();
  const cameraRef = useRef<CameraView>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();

  const [facing, setFacing] = useState<CameraType>('back');
  const [phase, setPhase] = useState<CapturePhase>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Ready to record');

  const activeRecordingRef = useRef<{
    videoId: string;
    startedAt: string;
    startedAtMs: number;
    startMetadata: RecordingStartMetadata;
    recordPromise: Promise<{ uri: string } | undefined>;
  } | null>(null);

  const maxDurationMs = env.maxRecordingDurationSeconds * 1000;

  useEffect(() => {
    if (phase !== 'recording') {
      return;
    }

    const intervalId = setInterval(() => {
      const active = activeRecordingRef.current;
      if (!active) {
        return;
      }

      setElapsedMs(Date.now() - active.startedAtMs);
    }, 250);

    return () => clearInterval(intervalId);
  }, [phase]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!cameraPermission?.granted) {
      const cameraResult = await requestCameraPermission();
      if (!cameraResult.granted) {
        return false;
      }
    }

    if (!microphonePermission?.granted) {
      const microphoneResult = await requestMicrophonePermission();
      if (!microphoneResult.granted) {
        return false;
      }
    }

    return true;
  }, [
    cameraPermission?.granted,
    microphonePermission?.granted,
    requestCameraPermission,
    requestMicrophonePermission,
  ]);

  const finalizeRecording = useCallback(async () => {
    const active = activeRecordingRef.current;
    if (!active || !workerId) {
      return;
    }

    setPhase('saving');
    setStatusMessage('Saving video and metadata...');

    try {
      const result = await active.recordPromise;
      if (!result?.uri) {
        throw new Error('Recording did not produce a video file.');
      }

      const endedAt = new Date().toISOString();
      const savedRecord = await completeRecording({
        videoId: active.videoId,
        workerId,
        startedAt: active.startedAt,
        endedAt,
        tempUri: result.uri,
        startMetadata: active.startMetadata,
      });

      activeRecordingRef.current = null;
      setPhase('idle');
      setElapsedMs(0);
      setStatusMessage('Ready to record');

      Alert.alert(
        'Video saved',
        `Saved ${savedRecord.videoId}\nDuration: ${Math.round(savedRecord.durationMs / 1000)}s\nUpload status: pending`
      );
    } catch (error) {
      activeRecordingRef.current = null;
      setPhase('idle');
      setElapsedMs(0);
      setStatusMessage('Ready to record');

      const message = error instanceof Error ? error.message : 'Failed to save recording';
      Alert.alert('Save failed', message);
    }
  }, [workerId]);

  const startRecording = useCallback(async () => {
    if (!workerId || phase !== 'idle') {
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission required', 'Camera and microphone access are needed to record video.');
      return;
    }

    const videoId = uuidv4();
    const startedAt = new Date().toISOString();
    const startedAtMs = Date.now();
    const startMetadata = await collectRecordingStartMetadata();

    const recordPromise = cameraRef.current?.recordAsync({
      maxDuration: env.maxRecordingDurationSeconds,
      maxFileSize: 100 * 1024 * 1024,
      videoQuality: RECORDING_VIDEO_QUALITY,
    });

    if (!recordPromise) {
      Alert.alert('Camera not ready', 'Please wait for the camera to initialize.');
      return;
    }

    activeRecordingRef.current = {
      videoId,
      startedAt,
      startedAtMs,
      startMetadata,
      recordPromise,
    };

    setPhase('recording');
    setElapsedMs(0);
    setStatusMessage('Recording in progress');

    void recordPromise
      .then(() => {
        if (activeRecordingRef.current?.videoId === videoId) {
          void finalizeRecording();
        }
      })
      .catch((error: unknown) => {
        activeRecordingRef.current = null;
        setPhase('idle');
        setElapsedMs(0);
        setStatusMessage('Ready to record');

        const message = error instanceof Error ? error.message : 'Recording failed';
        Alert.alert('Recording failed', message);
      });
  }, [finalizeRecording, phase, requestPermissions, workerId]);

  const stopRecording = useCallback(() => {
    if (phase !== 'recording') {
      return;
    }

    cameraRef.current?.stopRecording();
  }, [phase]);

  const toggleCamera = useCallback(() => {
    if (phase === 'recording') {
      return;
    }

    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }, [phase]);

  if (!cameraPermission || !microphonePermission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  if (!cameraPermission.granted || !microphonePermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionText}>
          This app records first-person video. Please allow camera and microphone permissions.
        </Text>
        <Pressable style={styles.primaryButton} onPress={() => void requestPermissions()}>
          <Text style={styles.primaryButtonText}>Grant permissions</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onBack}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="video"
        videoQuality={RECORDING_VIDEO_QUALITY}
      />

      <View style={styles.overlay}>
        <View style={styles.topRow}>
          <Pressable style={styles.secondaryButton} onPress={onBack} disabled={phase === 'saving'}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
          <Text style={styles.timer}>{formatRecordingTimer(elapsedMs)}</Text>
          <Text style={styles.limit}>
            / {formatRecordingTimer(maxDurationMs)}
          </Text>
        </View>

        <Text style={styles.status}>{statusMessage}</Text>

        <View style={styles.controls}>
          <Pressable
            style={[styles.secondaryButton, phase === 'recording' && styles.disabledButton]}
            onPress={toggleCamera}
            disabled={phase === 'recording' || phase === 'saving'}
          >
            <Text style={styles.secondaryButtonText}>
              {facing === 'back' ? 'Use front camera' : 'Use back camera'}
            </Text>
          </Pressable>

          {phase === 'recording' ? (
            <Pressable style={styles.stopButton} onPress={stopRecording}>
              <Text style={styles.primaryButtonText}>Stop</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.recordButton, phase === 'saving' && styles.disabledButton]}
              onPress={() => void startRecording()}
              disabled={phase === 'saving'}
            >
              {phase === 'saving' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Record</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B1220',
  },
  permissionContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#0B1220',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#9CA3AF',
    marginBottom: 20,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timer: {
    marginLeft: 'auto',
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  limit: {
    color: '#D1D5DB',
    fontSize: 16,
    marginLeft: 6,
  },
  status: {
    color: '#E5E7EB',
    marginBottom: 16,
  },
  controls: {
    gap: 12,
  },
  recordButton: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#6B7280',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: '#F9FAFB',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

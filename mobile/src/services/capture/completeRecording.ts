import { File } from 'expo-file-system';

import { insertVideo } from '../../db/videoRepository';
import type { NewVideoRecordInput } from '../../types/video';
import { uploadQueueWorker } from '../upload/uploadQueueWorker';
import { DEFAULT_RECORDING_FPS, deriveFpsTier } from '../../utils/fps';
import {
  collectBatteryLevelEnd,
  collectDeviceMetadata,
  normalizeBatteryLevel,
  type RecordingStartMetadata,
} from './metadataCollector';
import { RECORDING_VIDEO_QUALITY, RESOLUTION_BY_QUALITY } from './recordingConfig';
import { persistRecordedVideo } from './videoStorage';

export interface CompleteRecordingInput {
  videoId: string;
  workerId: string;
  startedAt: string;
  endedAt: string;
  tempUri: string;
  startMetadata: RecordingStartMetadata;
}

export async function completeRecording(input: CompleteRecordingInput): Promise<NewVideoRecordInput> {
  const localPath = await persistRecordedVideo(input.videoId, input.tempUri);
  const savedFile = new File(localPath);

  try {
    const device = await collectDeviceMetadata();
    const batteryLevelEnd = normalizeBatteryLevel(await collectBatteryLevelEnd());

    const durationMs = Math.max(
      0,
      new Date(input.endedAt).getTime() - new Date(input.startedAt).getTime()
    );

    const fps = DEFAULT_RECORDING_FPS;
    const record: NewVideoRecordInput = {
      videoId: input.videoId,
      workerId: input.workerId,
      startedAt: input.startedAt,
      endedAt: input.endedAt,
      durationMs,
      fileSizeBytes: savedFile.size,
      fps,
      fpsTier: deriveFpsTier(fps),
      deviceModel: device.deviceModel,
      osVersion: device.osVersion,
      resolution: RESOLUTION_BY_QUALITY[RECORDING_VIDEO_QUALITY],
      localPath,
      uploadState: 'pending',
      metadataJson: JSON.stringify({
        batteryLevelStart: input.startMetadata.batteryLevelStart,
        batteryLevelEnd,
        gpsStart: input.startMetadata.gpsStart,
        videoQuality: RECORDING_VIDEO_QUALITY,
        fpsSource: 'derived_default',
      }),
    };

    await insertVideo(record);
    uploadQueueWorker.wake();
    return record;
  } catch (error) {
    if (savedFile.exists) {
      savedFile.delete();
    }
    throw error;
  }
}

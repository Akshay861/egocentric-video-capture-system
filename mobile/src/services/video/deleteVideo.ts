import { File } from 'expo-file-system';

import { deleteVideoById, getVideoById } from '../../db/videoRepository';

export async function deleteVideoAndLocalFile(videoId: string): Promise<void> {
  const video = await getVideoById(videoId);
  if (!video) {
    throw new Error('Video not found.');
  }

  if (video.uploadState === 'uploading') {
    throw new Error('Cannot delete while upload is in progress.');
  }

  const deleted = await deleteVideoById(videoId);
  if (!deleted) {
    throw new Error('Failed to remove video record from database.');
  }

  const file = new File(video.localPath);
  if (file.exists) {
    file.delete();
  }
}

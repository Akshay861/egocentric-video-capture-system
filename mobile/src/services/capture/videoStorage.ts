import { Directory, File, Paths } from 'expo-file-system';

const VIDEOS_FOLDER = 'videos';

function getVideosDirectory(): Directory {
  return new Directory(Paths.document, VIDEOS_FOLDER);
}

function ensureVideosDirectory(): Directory {
  const videosDir = getVideosDirectory();
  if (!videosDir.exists) {
    videosDir.create();
  }

  return videosDir;
}

export async function persistRecordedVideo(videoId: string, tempUri: string): Promise<string> {
  const videosDir = ensureVideosDirectory();
  const sourceFile = new File(tempUri);
  const destinationFile = new File(videosDir, `${videoId}.mp4`);

  await sourceFile.copy(destinationFile);
  return destinationFile.uri;
}

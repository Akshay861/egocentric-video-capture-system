const TECHNICAL_TO_FRIENDLY: Record<string, string> = {
  'Video not found.': 'This recording could not be found on your device.',
  'Cannot delete while upload is in progress.':
    'Please wait until the cloud upload finishes before deleting this recording.',
  'Failed to remove video record from database.':
    'We could not remove this recording. Please try again.',
  'Presign response does not match requested video identity.':
    'The upload server returned an unexpected response. Please try again.',
  'Upload succeeded but S3 did not return an ETag for confirmation.':
    'The cloud could not confirm your upload. Please try again.',
  'Upload completed but database state transition was rejected.':
    'The upload finished but we could not update the status. Please refresh and try again.',
  'Recording did not produce a video file.':
    'No video file was created. Please record again.',
  'Failed to save recording': 'We could not save your recording. Please try again.',
  'Recording failed': 'Recording was interrupted. Please try again.',
  'Failed to load videos.': 'We could not load your recordings. Pull down to refresh.',
  'Could not start upload.': 'We could not start the cloud upload. Please try again.',
  'Could not delete video.': 'We could not delete this recording. Please try again.',
  'Only pending or failed videos can be uploaded.':
    'This recording is already uploading or has been uploaded.',
  'Login failed': 'We could not sign you in. Please check your details and try again.',
};

export const userMessages = {
  login: {
    emptyIdentifier: 'Please enter your email or phone number.',
    invalidEmail: 'Please enter a valid email address.',
    invalidPhone: 'Please enter a valid phone number with country code.',
    genericFailure: 'We could not sign you in. Please try again.',
  },
  capture: {
    permissionsTitle: 'Camera access needed',
    permissionsBody:
      'EgoCapture needs camera and microphone access to record first-person videos.',
    cameraNotReadyTitle: 'Camera is starting',
    cameraNotReadyBody: 'Please wait until the camera preview appears, then tap Record.',
    recordingInProgressTitle: 'Recording in progress',
    recordingInProgressBody: 'Stop the recording before leaving this screen.',
    saveSuccessTitle: 'Saved on this device',
    saveSuccessBody:
      'Your recording is stored safely on this phone. Cloud upload will start automatically.',
    saveFailedTitle: 'Could not save recording',
    recordingFailedTitle: 'Recording stopped',
    ready: 'Ready to record',
    recording: 'Recording...',
    saving: 'Saving your recording...',
    loadingCamera: 'Loading camera...',
  },
  library: {
    loadFailed: 'We could not load your recordings. Pull down to refresh.',
    uploadUnavailableTitle: 'Upload not available',
    uploadUnavailableBody: 'Only recordings waiting to upload or that failed can be retried.',
    uploadFailedTitle: 'Upload could not start',
    deleteFailedTitle: 'Delete failed',
    deleteConfirmTitle: 'Delete this recording?',
    deleteConfirmBody:
      'This removes the video from your phone and clears it from the app. This cannot be undone.',
    empty: 'No recordings yet. Capture your first video from the Operations Hub.',
    cloudFailedInline: 'Failed to upload on cloud',
  },
  upload: {
    retryFailed: 'Retry cloud upload',
    uploadNow: 'Upload now',
  },
  startup: {
    bootstrappingTitle: 'Starting EgoCapture',
    bootstrappingBody: 'Preparing your local database and upload queue.',
    restoringSessionTitle: 'Welcome back',
    restoringSessionBody: 'Restoring your saved session on this device.',
    failedTitle: 'Could not start app',
    failedBody: 'The app could not finish starting. Close and reopen the app, then try again.',
  },
} as const;

export function toUserMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof Error) {
    if (error.message.startsWith('Local video file not found')) {
      return 'The video file is no longer on this device. Delete this entry or record again.';
    }

    if (error.message.startsWith('S3 upload failed')) {
      return 'The cloud upload could not finish. Check your connection and try again.';
    }

    return TECHNICAL_TO_FRIENDLY[error.message] ?? error.message ?? fallback;
  }

  if (typeof error === 'string' && error.trim()) {
    return TECHNICAL_TO_FRIENDLY[error] ?? error;
  }

  return fallback;
}

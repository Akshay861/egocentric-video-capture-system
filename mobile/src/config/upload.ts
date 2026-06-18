export const uploadConfig = {
  maxAttempts: 6,
  minBackoffSeconds: 2,
  maxBackoffSeconds: 64,
  preparingDelayMs: 500,
  queuePollIntervalMs: 5_000,
  videoContentType: 'video/mp4',
};

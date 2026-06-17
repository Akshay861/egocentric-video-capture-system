export function computeBackoffSeconds(attemptCount: number): number {
  const exponential = Math.pow(2, Math.max(attemptCount, 1));
  return Math.min(exponential, 64);
}

export function getRetryDelayMs(attemptCount: number): number {
  return computeBackoffSeconds(attemptCount) * 1000;
}

export function isReadyForRetry(
  uploadState: 'pending' | 'failed',
  attemptCount: number,
  lastAttemptedAt: string | null,
  maxAttempts: number
): boolean {
  if (uploadState === 'pending') {
    return true;
  }

  if (attemptCount >= maxAttempts) {
    return false;
  }

  if (!lastAttemptedAt) {
    return true;
  }

  const delayMs = getRetryDelayMs(attemptCount);
  const nextAttemptAt = new Date(lastAttemptedAt).getTime() + delayMs;
  return Date.now() >= nextAttemptAt;
}

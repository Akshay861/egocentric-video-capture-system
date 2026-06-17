import { useCallback, useEffect, useState } from 'react';

import { countUploadStates } from '../db/uploadRepository';
import { uploadQueueWorker } from '../services/upload/uploadQueueWorker';
import type { UploadState } from '../types/video';

const EMPTY_COUNTS: Record<UploadState, number> = {
  pending: 0,
  uploading: 0,
  uploaded: 0,
  failed: 0,
};

export function useUploadQueueStats(workerId: string | null) {
  const [counts, setCounts] = useState<Record<UploadState, number>>(EMPTY_COUNTS);

  const refresh = useCallback(async () => {
    if (!workerId) {
      setCounts(EMPTY_COUNTS);
      return;
    }

    const next = await countUploadStates(workerId);
    setCounts(next);
  }, [workerId]);

  useEffect(() => {
    void refresh();

    const unsubscribe = uploadQueueWorker.subscribe(() => {
      void refresh();
    });

    const intervalId = setInterval(() => {
      void refresh();
    }, 5_000);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [refresh]);

  return { counts, refresh };
}

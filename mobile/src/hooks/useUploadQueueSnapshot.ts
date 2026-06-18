import { useEffect, useState } from 'react';

import {
  uploadQueueWorker,
  type UploadQueueSnapshot,
} from '../services/upload/uploadQueueWorker';

export function useUploadQueueSnapshot(): UploadQueueSnapshot {
  const [snapshot, setSnapshot] = useState<UploadQueueSnapshot>(() => uploadQueueWorker.getSnapshot());

  useEffect(() => {
    setSnapshot(uploadQueueWorker.getSnapshot());
    return uploadQueueWorker.subscribe(() => {
      setSnapshot(uploadQueueWorker.getSnapshot());
    });
  }, []);

  return snapshot;
}

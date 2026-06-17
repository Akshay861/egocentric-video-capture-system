import { getDatabase } from '../db/client';
import { uploadQueueWorker } from './upload/uploadQueueWorker';

export interface BootstrapResult {
  databaseReady: boolean;
  uploadQueueReady: boolean;
  initializedAt: string;
}

export async function bootstrapApp(): Promise<BootstrapResult> {
  await getDatabase();
  await uploadQueueWorker.initialize();

  return {
    databaseReady: true,
    uploadQueueReady: true,
    initializedAt: new Date().toISOString(),
  };
}

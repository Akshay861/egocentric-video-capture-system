import { getDatabase } from '../db/client';

export interface BootstrapResult {
  databaseReady: boolean;
  initializedAt: string;
}

export async function bootstrapApp(): Promise<BootstrapResult> {
  await getDatabase();

  return {
    databaseReady: true,
    initializedAt: new Date().toISOString(),
  };
}

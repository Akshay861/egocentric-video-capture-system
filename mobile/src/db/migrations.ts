import type { SQLiteDatabase } from 'expo-sqlite';

import { CREATE_INDEXES_SQL, CREATE_UPLOAD_EVENTS_TABLE_SQL, CREATE_VIDEOS_TABLE_SQL } from './schema';

const MIGRATIONS: Array<{ version: number; statements: string[] }> = [
  {
    version: 1,
    statements: [CREATE_VIDEOS_TABLE_SQL, CREATE_UPLOAD_EVENTS_TABLE_SQL, ...CREATE_INDEXES_SQL],
  },
];

const CREATE_META_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS schema_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version INTEGER NOT NULL
);
`;

export async function runMigrations(db: SQLiteDatabase): Promise<number> {
  await db.execAsync(CREATE_META_TABLE_SQL);

  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_meta WHERE id = 1'
  );

  const currentVersion = row?.version ?? 0;
  const pending = MIGRATIONS.filter((m) => m.version > currentVersion).sort(
    (a, b) => a.version - b.version
  );

  for (const migration of pending) {
    await db.withTransactionAsync(async () => {
      for (const statement of migration.statements) {
        await db.execAsync(statement);
      }

      await db.runAsync(
        'INSERT INTO schema_meta (id, version) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET version = excluded.version',
        migration.version
      );
    });
  }

  return pending.length > 0 ? pending[pending.length - 1].version : currentVersion;
}

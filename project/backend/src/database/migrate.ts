import { SQLiteDatabase } from "./db";
import fs from "fs";
import path from "path";

type Migration = {
  id: number,
  name: string,
  filename: string,
  up: string,
  down: string,
}

/** Type describing a database migration.
 *
 * @param force if true, we drop then re-apply the last migration when this method is called
 * @param table table to store migrations in. Defaults to 'migration'
 * @param migrationsPath path to where migration files resides, relative to the app root. Defaults to '.migrations'
 */
export type MigrationOptions = {
  force?: boolean,
  table?: string,
  migrationsPath?: string
}

/** Method for running a database migration.
   *
   * @param force if true, we drop then re-apply the last migration when this method is called
   * @param table table to store migrations in. Defaults to 'migration'
   * @param migrationsPath path to where migration files resides, relative to the app root. Defualts to '.migrations'
   */
export function migrate(database: SQLiteDatabase, opts: MigrationOptions) {
  const force = opts.force || false;
  const table = opts.table || 'migrations';
  const migrationsPath = opts.migrationsPath || '.migrations';
  const location = migrationsPath;

  // Get the list of migration files, for example:
  //   { id: 1, name: 'initial', filename: '001-initial.sql' }
  //   { id: 2, name: 'feature', filename: '002-feature.sql' }
  const files = fs.readdirSync(location);
  const migrations: Migration[] = [];
  for (const file of files) {
    const match = file.match(/^(\d+).(.*?)\.sql$/);
    if (match) {
      migrations.push({ id: Number(match[1]), name: match[2], filename: match[0], up: '', down: '' });
    }
  }
  migrations.sort((a, b) => Math.sign(a.id - b.id));

  if (!migrations.length) {
    throw new Error(`No migration files found in '${location}'.`);
  }

  // Get the list of migrations, for example:
  //   { id: 1, name: 'initial', filename: '001-initial.sql', up: ..., down: ... }
  //   { id: 2, name: 'feature', fielname: '002-feature.sql', up: ..., down: ... }
  migrations.map(migration => {
    const filename = path.join(location, migration.filename);
    const data = fs.readFileSync(filename, 'utf-8');
    const [up, down] = data.split(/^--\s+?down\b/mi);
    if (!down) {
      const message = `The ${migration.filename} file does not contain '-- down' separator.`;
      throw new Error(message);
    }
    else {
      // Trim comment rows and white spaces
      migration.up = up.replace(/--.*?$/gm, '').trim();
      migration.down = down.replace(/--.*?$/gm, '').trim();
    }
  });

  // Create a this.database table for migrations meta data if it doesn't exist
  database.ddl(
    `CREATE TABLE IF NOT EXISTS "${table}" (
        id   INTEGER PRIMARY KEY,
        name TEXT    NOT NULL,
        up   TEXT    NOT NULL,
        down TEXT    NOT NULL
    );`
  );

  // Get the list of already applied migrations
  let dbMigrations = database.queryAll<Migration>(
    `SELECT id, name, up, down FROM "${table}" ORDER BY id ASC;`,
  );

  // Undo migrations that exist only in the database but not in files,
  // also undo the last migration if the `force` option was set to `last`.
  const lastMigration = migrations[migrations.length - 1];
  for (const migration of dbMigrations.slice().sort((a, b) => Math.sign(b.id - a.id))) {
    if (force && migration.id === lastMigration.id) {
      database.transaction(() => {
        database.executeRaw(migration.down);
        database.update(`DELETE FROM "${table}" WHERE id = ?`, migration.id);
        dbMigrations = dbMigrations.filter(x => x.id !== migration.id);
      });
    }
    else if (!migrations.some(x => x.id === migration.id)) {
      console.error(`Migration integrity error. File for migration ${migration.filename} found in the database, but it's missing from the file system.`);
    }
    else {
      break;
    }
  }

  // Apply pending migrations
  const lastMigrationId = dbMigrations.length ? dbMigrations[dbMigrations.length - 1].id : 0;
  for (const migration of migrations) {
    if (migration.id > lastMigrationId) {
      database.transaction(() => {
        database.executeRaw(migration.up);
        database.update(`INSERT INTO "${table}" VALUES (:id, :name, :up, :down);`, migration);
      });
    }
  }
}

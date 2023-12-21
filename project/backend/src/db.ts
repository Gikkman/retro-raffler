import { SQLiteDatabase } from './database/db';
import { migrate } from './database/migrate';
const db = SQLiteDatabase.inMemory().setVerboseLogger(console.log).build();
migrate(db, {migrationsPath: __dirname + "/../../migrations"});


export function create() {
  db.ddl(`
    CREATE TABLE IF NOT EXISTS 'msg' (
      'id' INTEGER PRIMARY KEY AUTOINCREMENT,
      'message' TEXT NOT NULL
    );
  `);
}

export function insert() {
  const str = Math.random().toString(36).slice(2, 7);
  db.update(`INSERT INTO msg (message) VALUES (?)`, str);
}

export function all() {
  return db.queryAll("SELECT * FROM msg");
}

import { readdirSync, readFileSync } from 'fs';
import { SQLiteDatabase } from "../backend/src/database/db";
import { migrate } from "../backend/src/database/migrate";

const migrationFiles = readdirSync(__dirname).filter(f => f.endsWith(".sql"));
const migrations = [];
let fileError = false;
for( const m of migrationFiles) {
  const content = readFileSync(m, "utf-8");
  const [up, down] = content.split(/^--\s+?down\b/mi);
  if(!up) {
    fileError = true;
    console.error(`File ${m} is missing a "up" block"`);
  }
  if(!down) {
    fileError = true;
    console.error(`File ${m} is missing a "down" block"`);
  }
  migrations.push({file: m,
    down: down.replace(/--.*?$/gm, '').trim(),
    up: up.replace(/--.*?$/gm, '').trim()});
}
if(fileError) {
  process.exit(1);
}

const db = SQLiteDatabase.inMemory().setVerboseLogger(console.log).build();

console.log("*** Applying 'up' of all migrations");
migrate(db, {migrationsPath: "."});
console.log("*** All migrations 'up' applied successfully. Applying 'down' of all migrations in reverse order");
migrations.reverse();
for(const m of migrations) {
  console.log(`** Applying 'down' of ${m.file}.`);
  db.executeRaw(m.down);
}
console.log("*** All migrations 'down' applied successfully. Test succeeded");

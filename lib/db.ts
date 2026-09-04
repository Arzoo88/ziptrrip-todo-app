import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS todos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    description TEXT,
    completed   INTEGER NOT NULL DEFAULT 0,
    priority    TEXT NOT NULL DEFAULT 'medium',
    dueDate     TEXT,
    createdAt   TEXT NOT NULL,
    updatedAt   TEXT NOT NULL
  );
`;

/**
 * Creates a new database connection with the schema applied.
 * Pass ":memory:" for an ephemeral in-memory DB (used in unit tests).
 */
export function createDb(filePath: string = getDefaultDbPath()): Database.Database {
  if (filePath !== ":memory:") {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  const db = new Database(filePath);
  db.pragma("journal_mode = WAL");
  db.exec(SCHEMA);
  return db;
}

function getDefaultDbPath(): string {
  return path.join(process.cwd(), "data", "todos.db");
}

// Singleton connection used by the Next.js API routes at runtime.
// Using a global var avoids creating a new connection on every hot-reload in dev.
declare global {
  // eslint-disable-next-line no-var
  var __todoDb: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (!global.__todoDb) {
    global.__todoDb = createDb();
  }
  return global.__todoDb;
}

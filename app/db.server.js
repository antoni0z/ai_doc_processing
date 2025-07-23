import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "app", "app.db");
const SCHEMA_PATH = path.join(process.cwd(), "db_schema.sql");

export const db = new DatabaseSync(DB_PATH);

const exists = db
  .prepare(
    "SELECT 1 FROM sqlite_master WHERE type='table' AND name='project'"
  )
  .get();

if (!exists) {
  try {
    const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
    db.exec(schema);
  } catch (error) {
    console.error("Error creando esquema:", error);
  }
}

// Enable security and performance settings
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA synchronous = NORMAL;");
db.exec("PRAGMA cache_size = -64000;"); // 64MB cache
db.exec("PRAGMA busy_timeout = 30000;"); // 30 second timeout

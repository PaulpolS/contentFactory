import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Get vault root from environment variable or default to the workspace location
export const VAULT_EXTERNAL_ROOT = process.env.VAULT_ROOT || 
                                   process.env.VAULT_EXTERNAL_ROOT || 
                                   path.resolve(__dirname, '../../../content_vault');

export const DB_PATH = path.join(VAULT_EXTERNAL_ROOT, 'databases/content_pool.db');

// Ensure db directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Failed to open database content pool:', err);
  } else {
    console.log('📂 Content Pool SQLite Database connected successfully at:', DB_PATH);
  }
});

// Configure SQLite environment for performance and integrity
db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');
  
  // Create vault_contents table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS vault_contents (
      id TEXT PRIMARY KEY,
      source_type TEXT NOT NULL,
      title TEXT NOT NULL,
      selected_headline TEXT,
      raw_content TEXT,
      source_url TEXT NOT NULL,
      author_name TEXT,
      author_avatar_url TEXT,
      author_followers INTEGER,
      rating_news INTEGER DEFAULT 0,
      rating_evergreen INTEGER DEFAULT 0,
      metadata_json TEXT,
      media_paths_json TEXT,
      status TEXT DEFAULT 'scraped',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // Create generated_graphics table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS generated_graphics (
      id TEXT PRIMARY KEY,
      content_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      image_ratio TEXT NOT NULL,
      theme_name TEXT,
      dropbox_link TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY(content_id) REFERENCES vault_contents(id) ON DELETE CASCADE
    )
  `);

  // Create api_credentials table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS api_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_name TEXT NOT NULL,
      key_name TEXT DEFAULT 'Default',
      credential_key TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      is_primary INTEGER DEFAULT 0,
      usage_limit REAL DEFAULT 0.0,
      current_usage REAL DEFAULT 0.0,
      updated_at TEXT NOT NULL
    )
  `);

  // Migration to dynamically add key_name column if it does not exist in api_credentials table
  db.run("ALTER TABLE api_credentials ADD COLUMN key_name TEXT DEFAULT 'Default'", (err) => {
    if (err) {
      // Column already exists, which is the expected case after first run
    } else {
      console.log('📂 [DATABASE MIGRATION] Added column key_name to api_credentials table.');
    }
  });

  // Migration to dynamically add is_primary column if it does not exist in api_credentials table
  db.run("ALTER TABLE api_credentials ADD COLUMN is_primary INTEGER DEFAULT 0", (err) => {
    if (err) {
      // Column already exists
    } else {
      console.log('📂 [DATABASE MIGRATION] Added column is_primary to api_credentials table.');
      // Initialize existing 'Default' keys to be is_primary = 1
      db.run("UPDATE api_credentials SET is_primary = 1 WHERE key_name = 'Default'");
    }
  });

  // Migration to dynamically add dropbox_link column if it does not exist in generated_graphics table
  db.run("ALTER TABLE generated_graphics ADD COLUMN dropbox_link TEXT", (err) => {
    if (err) {
      // Column already exists
    } else {
      console.log('📂 [DATABASE MIGRATION] Added column dropbox_link to generated_graphics table.');
    }
  });
});

export interface RunResult {
  lastID: number;
  changes: number;
}

/**
 * Executes a query and returns all matching rows.
 */
export const dbQueryAll = <T = any>(sql: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as T[]);
      }
    });
  });
};

/**
 * Executes a query and returns the first matching row, or undefined if no row matches.
 */
export const dbQueryGet = <T = any>(sql: string, params: any[] = []): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row as T | undefined);
      }
    });
  });
};

/**
 * Executes an INSERT, UPDATE, or DELETE query and returns the modification metadata.
 */
export const dbRun = (sql: string, params: any[] = []): Promise<RunResult> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({
          lastID: this.lastID,
          changes: this.changes,
        });
      }
    });
  });
};

export default db;

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

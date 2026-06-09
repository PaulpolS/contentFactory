import os
import sys
import logging
from logging.handlers import RotatingFileHandler
import sqlite3
import json
from datetime import datetime

# Optional: Add terminal colors for beautiful logging if supported
class ColorFormatter(logging.Formatter):
    """Custom color formatter for stdout logging."""
    GREY = "\x1b[38;20m"
    GREEN = "\x1b[32;20m"
    YELLOW = "\x1b[33;20m"
    RED = "\x1b[31;20m"
    BOLD_RED = "\x1b[31;1m"
    RESET = "\x1b[0m"
    
    FORMATS = {
        logging.DEBUG: GREY + '[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s' + RESET,
        logging.INFO: GREEN + '[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s' + RESET,
        logging.WARNING: YELLOW + '[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s' + RESET,
        logging.ERROR: RED + '[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s' + RESET,
        logging.CRITICAL: BOLD_RED + '[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s' + RESET
    }

    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno, self.GREY + '[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s' + RESET)
        formatter = logging.Formatter(log_fmt, datefmt='%Y-%m-%d %H:%M:%S')
        return formatter.format(record)


class VaultSystemInitializer:
    """System to prepare external root data folders and set up SQLite database and logging."""
    def __init__(self, external_root_path: str):
        self.root_path = os.path.abspath(external_root_path)
        self.db_dir = os.path.join(self.root_path, "databases")
        self.db_path = os.path.join(self.db_dir, "content_pool.db")
        self.log_path = os.path.join(self.db_dir, "vault_system.log")
        self.logger = None

    def setup_directories(self):
        """Verifies and creates all required vault subdirectories."""
        subdirs = [
            "databases",
            "downloaded_media/competitor_assets",
            "downloaded_media/youtube_frames",
            "downloaded_media/author_logos",
            "generated_graphics/pillow_renders",
            "exports_csv/deep_research"
        ]
        print(f"[*] Starting Content Vault directories setup at: {self.root_path}")
        for folder in subdirs:
            full_path = os.path.join(self.root_path, folder)
            os.makedirs(full_path, exist_ok=True)
            print(f" - Created / Verified: {full_path}")
        return self

    def setup_logging(self):
        """Configures dual-target logging (RotatingFileHandler + Console StreamHandler)."""
        self.logger = logging.getLogger("VaultSystem")
        self.logger.setLevel(logging.DEBUG)
        
        # Prevent duplicate log messages if initializer is run multiple times
        if self.logger.hasHandlers():
            self.logger.handlers.clear()

        # 1. Base log format for files
        file_format = logging.Formatter(
            '[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )

        # File logging on External Root Folder (Limit 10MB, Keep 5 Backups)
        file_handler = RotatingFileHandler(
            self.log_path, maxBytes=10*1024*1024, backupCount=5, encoding='utf-8'
        )
        file_handler.setFormatter(file_format)
        file_handler.setLevel(logging.DEBUG)
        self.logger.addHandler(file_handler)

        # 2. Interactive Console Logging (with colors if run interactively, otherwise clear text)
        console_handler = logging.StreamHandler(sys.stdout)
        if sys.stdout.isatty():
            console_handler.setFormatter(ColorFormatter())
        else:
            console_handler.setFormatter(file_format)
        console_handler.setLevel(logging.INFO)
        self.logger.addHandler(console_handler)

        self.logger.info("Vault logging configured successfully across console and file destinations.")
        return self

    def initialize_sqlite_db(self):
        """Initializes the SQLite database and sets up tables specified in Spec 00."""
        self.logger.info(f"Connecting to SQLite database: {self.db_path}")
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Table 1: vault_contents
        cursor.execute("""
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
        """)

        # Table 2: generated_graphics
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS generated_graphics (
            id TEXT PRIMARY KEY,
            content_id TEXT NOT NULL,
            file_path TEXT NOT NULL,
            image_ratio TEXT NOT NULL,
            theme_name TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(content_id) REFERENCES vault_contents(id) ON DELETE CASCADE
        )
        """)

        # Table 3: api_credentials
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS api_credentials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            service_name TEXT NOT NULL,
            key_name TEXT DEFAULT 'Default',
            credential_key TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            usage_limit REAL DEFAULT 0.0,
            current_usage REAL DEFAULT 0.0,
            updated_at TEXT NOT NULL
        )
        """)

        # Migration: dynamically add key_name column if it does not exist
        try:
            cursor.execute("ALTER TABLE api_credentials ADD COLUMN key_name TEXT DEFAULT 'Default'")
            self.logger.info("📂 [DATABASE MIGRATION] Added column key_name to api_credentials table.")
        except sqlite3.OperationalError:
            # Column already exists
            pass

        conn.commit()
        conn.close()
        self.logger.info("SQLite tables created and verified successfully.")
        return self

    def seed_initial_credentials(self):
        """Seeds initial default credentials for services if they don't already exist."""
        self.logger.info("Seeding initial mock credentials...")
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        now = datetime.now().isoformat()

        seeds = [
            ("openrouter", "MOCK_OPENROUTER_KEY", 50.0),  # Limit $50 for safety
            ("apify", "MOCK_APIFY_KEY", 30.0),          # Limit $30 for safety
            ("github", "MOCK_GITHUB_KEY", 0.0)          # No limit (0.0 means unlimited in our model)
        ]

        for service, key, limit in seeds:
            cursor.execute("SELECT COUNT(*) FROM api_credentials WHERE service_name = ?", (service,))
            exists = cursor.fetchone()[0]
            if exists == 0:
                cursor.execute(
                    "INSERT INTO api_credentials (service_name, credential_key, is_active, usage_limit, current_usage, updated_at) "
                    "VALUES (?, ?, 1, ?, 0.0, ?)",
                    (service, key, limit, now)
                )
                self.logger.info(f" - Seeded {service} key successfully.")
            else:
                self.logger.info(f" - Service {service} key already exists, skipping seed.")

        conn.commit()
        conn.close()
        self.logger.info("Credentials seeding completed.")
        return self


class VaultCredentialManager:
    """Manages secure key retrieval, rotation logic, and dynamic key disabling upon failure/limits."""
    def __init__(self, db_path: str, logger: logging.Logger):
        self.db_path = db_path
        self.logger = logger

    def get_active_key(self, service: str) -> str:
        """Retrieves the first available active key for a service that has not exceeded its usage limit."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Query active keys. If usage_limit is 0.0, we treat it as unlimited.
        cursor.execute(
            "SELECT id, credential_key FROM api_credentials "
            "WHERE service_name = ? AND is_active = 1 "
            "AND (usage_limit <= 0.0 OR current_usage < usage_limit) "
            "ORDER BY current_usage ASC, id ASC LIMIT 1", (service,)
        )
        row = cursor.fetchone()
        conn.close()
        
        if row:
            self.logger.info(f"Successfully retrieved active key for service '{service}' (ID: {row[0]})")
            return row[1]
        else:
            self.logger.error(f"No active, valid, or within-limit credentials found for service '{service}'")
            raise ValueError(f"No active API keys found for '{service}'")

    def report_key_error(self, service: str, failed_key: str, error_message: str):
        """Disables the specific key when errors occur (rate limits, 402/429 errors, invalid keys) to rotate to a backup key."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        
        self.logger.warning(
            f"API Error detected on service '{service}' key: {error_message}. Deactivating key in database..."
        )
        cursor.execute(
            "UPDATE api_credentials SET is_active = 0, updated_at = ? "
            "WHERE service_name = ? AND credential_key = ?", 
            (now, service, failed_key)
        )
        conn.commit()
        conn.close()
        self.logger.info(f"Key successfully deactivated for '{service}'.")


if __name__ == "__main__":
    # Support specifying custom vault root via environment variable or command-line arguments
    env_root = os.environ.get("VAULT_ROOT") or os.environ.get("VAULT_EXTERNAL_ROOT")
    
    if len(sys.argv) > 1:
        vault_root = sys.argv[1]
    elif env_root:
        vault_root = env_root
    else:
        # Default to a local workspace content vault dir
        vault_root = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/content_vault"

    initializer = VaultSystemInitializer(vault_root)
    initializer.setup_directories()
    initializer.setup_logging()
    initializer.initialize_sqlite_db()
    initializer.seed_initial_credentials()

    # Verification run
    try:
        cred_mgr = VaultCredentialManager(initializer.db_path, initializer.logger)
        key = cred_mgr.get_active_key("openrouter")
        initializer.logger.info(f"Credential verification successful. Found active 'openrouter' key.")
    except Exception as e:
        initializer.logger.error(f"Initialization verification failed: {e}")

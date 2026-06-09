import os
import sys
import sqlite3
import time
import subprocess
import urllib.request
import urllib.error
import json

VAULT_ROOT = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/content_vault"
DB_PATH = os.path.join(VAULT_ROOT, "databases/content_pool.db")
SERVER_PORT = 5005
BASE_URL = f"http://localhost:{SERVER_PORT}/api/vault"

def log_test(msg, success=True):
    prefix = "[PASS]" if success else "[FAIL]"
    color = "\033[32m" if success else "\033[31m"
    reset = "\033[0m"
    print(f"{color}{prefix} {msg}{reset}")

def seed_test_data():
    print("[*] Seeding test database content...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Clear previous test rows if any
    cursor.execute("DELETE FROM vault_contents WHERE id LIKE 'test-%'")

    # Insert test row 1 (RSS, rating 8, status: ready_for_design)
    cursor.execute("""
        INSERT INTO vault_contents (
            id, source_type, title, selected_headline, raw_content, source_url, 
            author_name, rating_news, rating_evergreen, metadata_json, media_paths_json, 
            status, created_at, updated_at
        ) VALUES (
            'test-rss-1', 'rss', 'RSS Title One', 'หัวข้อการเลือก 1', 'Full RSS content 1', 'https://rss1.com',
            'Author A', 8, 4, '{"tags": ["tech", "ai"]}', '["downloaded_media/competitor_assets/rss1.png"]',
            'ready_for_design', '2026-05-27T10:00:00Z', '2026-05-27T10:00:00Z'
        )
    """)

    # Insert test row 2 (Radar, rating 5/9, status: scraped)
    cursor.execute("""
        INSERT INTO vault_contents (
            id, source_type, title, selected_headline, raw_content, source_url, 
            author_name, rating_news, rating_evergreen, metadata_json, media_paths_json, 
            status, created_at, updated_at
        ) VALUES (
            'test-radar-2', 'radar', 'Radar Title Two', NULL, 'Full radar content 2', 'https://radar2.com',
            'Author B', 3, 9, '{"shares": 150}', '[]',
            'scraped', '2026-05-27T10:30:00Z', '2026-05-27T10:30:00Z'
        )
    """)

    conn.commit()
    conn.close()
    print("[*] Database seeded.")

def create_mock_media_file():
    media_file = os.path.join(VAULT_ROOT, "downloaded_media/competitor_assets/rss1.png")
    os.makedirs(os.path.dirname(media_file), exist_ok=True)
    with open(media_file, "wb") as f:
        f.write(b"MOCK_PNG_DATA_FOR_VAULT_TEST")
    print(f"[*] Created mock media file at: {media_file}")

def send_request(url, method="GET", body=None, headers=None):
    if headers is None:
        headers = {}
    
    req_body = None
    if body is not None:
        req_body = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=req_body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as res:
            status = res.status
            content = res.read()
            # Try to decode content if text, otherwise return bytes
            try:
                content_str = content.decode("utf-8")
                return status, json.loads(content_str)
            except Exception:
                return status, content
    except urllib.error.HTTPError as e:
        try:
            err_content = e.read().decode("utf-8")
            return e.code, json.loads(err_content)
        except Exception:
            return e.code, e.reason

def run_tests():
    print("[*] Starting backend API endpoint verification tests...")

    # 1. Test GET /contents (all)
    status, res = send_request(f"{BASE_URL}/contents")
    if status == 200 and res.get("success") is True and res.get("count") >= 2:
        log_test(f"GET /contents returns success and {res.get('count')} rows")
    else:
        log_test(f"GET /contents failed: {res}", False)

    # 2. Test GET /contents with source_type filter
    status, res = send_request(f"{BASE_URL}/contents?source_type=rss")
    if status == 200 and res.get("count") == 1 and res.get("data")[0]["id"] == "test-rss-1":
        log_test("GET /contents?source_type=rss correctly filters RSS rows")
    else:
        log_test(f"GET /contents?source_type=rss failed: {res}", False)

    # 3. Test GET /contents with min_rating filter
    status, res = send_request(f"{BASE_URL}/contents?min_rating=8")
    # Both row 1 (rating_news=8) and row 2 (rating_evergreen=9) should match min_rating=8
    if status == 200 and res.get("count") == 2:
        log_test("GET /contents?min_rating=8 returns rows where news OR evergreen rating >= 8")
    else:
        log_test(f"GET /contents?min_rating=8 failed: {res}", False)

    # 4. Test GET /contents metadata & media_paths parsing
    if status == 200 and len(res.get("data")) > 0:
        row = [r for r in res.get("data") if r["id"] == "test-rss-1"][0]
        if isinstance(row.get("metadata"), dict) and row.get("metadata").get("tags") == ["tech", "ai"]:
            log_test("GET /contents correctly parses JSON metadata into an object")
        else:
            log_test(f"GET /contents failed parsing metadata: {row}", False)
        
        if isinstance(row.get("media_paths"), list) and row.get("media_paths") == ["downloaded_media/competitor_assets/rss1.png"]:
            log_test("GET /contents correctly parses media_paths into a list")
        else:
            log_test(f"GET /contents failed parsing media_paths: {row}", False)

    # 5. Test POST /contents/:id/status
    status, res = send_request(
        f"{BASE_URL}/contents/test-radar-2/status",
        method="POST",
        body={"status": "ready_for_design", "selected_headline": "พาดหัวแปลไทยแบบพรีเมียม"}
    )
    if status == 200 and res.get("success") is True:
        log_test("POST /contents/:id/status successfully transitions status and selected_headline")
        
        # Verify in DB
        status, verify_res = send_request(f"{BASE_URL}/contents")
        target_row = [r for r in verify_res.get("data") if r["id"] == "test-radar-2"][0]
        if target_row["status"] == "ready_for_design" and target_row["selected_headline"] == "พาดหัวแปลไทยแบบพรีเมียม":
            log_test("POST /contents/:id/status DB persistence verified")
        else:
            log_test(f"POST /contents/:id/status verification in DB failed: {target_row}", False)
    else:
        log_test(f"POST /contents/:id/status failed: {res}", False)

    # 6. Test GET /media (Safe serving)
    status, res = send_request(f"{BASE_URL}/media?path=downloaded_media/competitor_assets/rss1.png")
    if status == 200 and res == b"MOCK_PNG_DATA_FOR_VAULT_TEST":
        log_test("GET /media safely streams files from external storage folder")
    else:
        log_test(f"GET /media failed: status={status}, response={res}", False)

    # 7. Test Path Traversal Protection
    status, res = send_request(f"{BASE_URL}/media?path=../databases/content_pool.db")
    if status == 403:
        log_test("GET /media successfully BLOCKS path traversal attempt targeting database files (403 Forbidden)")
    else:
        log_test(f"GET /media path traversal vulnerability detected! Returned status {status}: {res}", False)

    status, res = send_request(f"{BASE_URL}/media?path=../../etc/passwd")
    if status == 403:
        log_test("GET /media successfully BLOCKS deeper path traversal outside VAULT_EXTERNAL_ROOT (403 Forbidden)")
    else:
        log_test(f"GET /media OS path traversal vulnerability detected! Returned status {status}: {res}", False)

if __name__ == "__main__":
    seed_test_data()
    create_mock_media_file()

    # Start Express Server
    print("[*] Starting backend Express server on port 5005...")
    env = os.environ.copy()
    env["VAULT_ROOT"] = VAULT_ROOT
    env["PORT"] = str(SERVER_PORT)
    
    server_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd="/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/backend",
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    # Wait for server to start
    time.sleep(3)

    try:
        run_tests()
    finally:
        # Stop Express Server
        print("[*] Shutting down backend Express server...")
        server_proc.terminate()
        server_proc.wait()
        print("[*] Server shutdown completed.")

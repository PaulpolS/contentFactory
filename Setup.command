#!/bin/bash
# ============================================================================
#  Setup.command — ติดตั้งทุกอย่างที่จำเป็นสำหรับ "เครื่องใหม่" (กดครั้งเดียว)
#  ใช้เมื่อ: ก็อปโฟลเดอร์โปรแกรมมาเครื่องใหม่ → ดับเบิลคลิกไฟล์นี้ก่อนเปิดโปรแกรม
# ============================================================================
cd "$(dirname "$0")"
ROOT="$(pwd)"

echo "=========================================================="
echo " 🛠️  ติดตั้งระบบ Content Factory บนเครื่องนี้"
echo "=========================================================="

# ---------- 0) เคลียร์ quarantine (กันป๊อปอัพ "ไฟล์เปิดไม่ได้" ตอนย้ายเครื่อง) ----------
# ตอนก็อปโฟลเดอร์ผ่าน AirDrop/ZIP ไฟล์ .command และ .node จะติด com.apple.quarantine
# ทำให้ดับเบิลคลิกไม่ติด และมีป๊อปอัพ "fsevents.node Not Opened" เด้ง — บรรทัดนี้ลบทิ้งให้
echo "🔓 กำลังเคลียร์ quarantine ของไฟล์ในโปรเจกต์..."
xattr -dr com.apple.quarantine "$ROOT" 2>/dev/null
chmod +x "$ROOT"/*.command "$ROOT"/scripts/*.sh 2>/dev/null
echo "✅ เคลียร์ quarantine เรียบร้อย"

# ---------- 1) Homebrew ----------
if ! command -v brew >/dev/null 2>&1; then
    echo "🍺 ยังไม่มี Homebrew — กำลังติดตั้ง (อาจถามรหัสเครื่อง)..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    # เพิ่ม brew เข้า PATH (Apple Silicon)
    [ -x /opt/homebrew/bin/brew ] && eval "$(/opt/homebrew/bin/brew shellenv)"
else
    echo "✅ มี Homebrew แล้ว"
fi

# ---------- 2) เครื่องมือที่จำเป็น ----------
for pkg in node python3 ffmpeg frei0r; do
    bin="$pkg"; [ "$pkg" = "python3" ] && bin="python3"
    if command -v "$bin" >/dev/null 2>&1 || [ "$pkg" = "frei0r" ]; then
        # frei0r ไม่มี command ตรวจ — เช็คไฟล์ .so แทน
        if [ "$pkg" = "frei0r" ] && ! ls /opt/homebrew/lib/frei0r-1/*.so >/dev/null 2>&1; then
            echo "📦 กำลังติดตั้ง frei0r..."; brew install frei0r || echo "   ⚠️ ข้าม frei0r (เอฟเฟกต์ Cartoon/Glitch จะใช้ไม่ได้)"
        else
            echo "✅ มี $pkg แล้ว"
        fi
    else
        echo "📦 กำลังติดตั้ง $pkg..."; brew install "$pkg"
    fi
done

# ---------- 3) Node dependencies (rebuild ให้ตรงเครื่องนี้) ----------
echo "📦 ติดตั้ง Node dependencies (backend)..."
( cd backend && npm install ) || { echo "❌ npm install backend ล้มเหลว"; exit 1; }
echo "📦 ติดตั้ง Node dependencies (frontend)..."
( cd frontend && npm install ) || { echo "❌ npm install frontend ล้มเหลว"; exit 1; }

# ---------- 4) Python dependencies ----------
if [ -f scripts/requirements.txt ]; then
    echo "🐍 ติดตั้ง Python dependencies..."
    pip3 install -r scripts/requirements.txt || python3 -m pip install -r scripts/requirements.txt || echo "   ⚠️ ติดตั้ง python deps ไม่ครบ (scrapers อาจมีปัญหา)"
fi

# ---------- 5) ตั้งค่าโฟลเดอร์ media (รูปหนัก แยกต่อเครื่อง) ----------
NEED_MEDIA=1
if [ -f media-location.txt ]; then
    SAVED="$(cat media-location.txt)"
    # ถ้า symlink ยังใช้ได้อยู่ ไม่ต้องตั้งใหม่
    if [ -e "content_vault/generated_graphics" ] && [ -L "content_vault/generated_graphics" ]; then
        echo "✅ โฟลเดอร์ media ตั้งไว้แล้วที่: $SAVED"
        NEED_MEDIA=0
    fi
fi

if [ "$NEED_MEDIA" = "1" ]; then
    echo ""
    echo "🗂️  เลือกโฟลเดอร์สำหรับเก็บ 'รูป/media' ของเครื่องนี้"
    echo "    (รูปจะไม่ถูกก็อปไปกับโปรแกรม จึงต้องเลือกที่เก็บของเครื่องนี้)"
    DEFAULT_MEDIA="$HOME/ContentFactoryMedia"
    CHOSEN=$(osascript -e "POSIX path of (choose folder with prompt \"เลือกโฟลเดอร์เก็บรูป/media ของเครื่องนี้\" default location (POSIX file \"$HOME\"))" 2>/dev/null || echo "")
    [ -z "$CHOSEN" ] && CHOSEN="$DEFAULT_MEDIA"
    CHOSEN="${CHOSEN%/}"
    echo "→ ใช้โฟลเดอร์: $CHOSEN"
    bash scripts/setup_media.sh "$CHOSEN" || { echo "❌ ตั้งค่า media ล้มเหลว"; exit 1; }
fi

# ---------- 6) เสร็จ ----------
touch .setup_complete
echo ""
echo "=========================================================="
echo " 🎉 ติดตั้งเสร็จสมบูรณ์!"
echo " ขั้นต่อไป: ดับเบิลคลิก StartApp.command เพื่อเปิดโปรแกรม"
echo "=========================================================="
echo "กด Enter เพื่อปิดหน้าต่างนี้..."
read -r

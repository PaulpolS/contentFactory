#!/bin/bash
# ============================================================================
#  setup_media.sh — ย้ายโฟลเดอร์ media หนักออกไปนอกโปรแกรม แล้วทำ symlink กลับ
#  ใช้: setup_media.sh "<MEDIA_ROOT>"
#  เรียกจาก Setup.command และจาก backend (POST /api/vault/media-location)
#
#  ปลอดภัย: ใช้ rsync + เทียบจำนวนไฟล์ให้ครบก่อนจึงลบของเดิม (ไม่ mv ทื่อ ๆ)
#  ทดสอบได้โดยตั้ง env CF_ROOT ชี้ไปโฟลเดอร์ทดสอบ
# ============================================================================
set -euo pipefail

MEDIA_ROOT="${1:-}"
if [ -z "$MEDIA_ROOT" ]; then
    echo "❌ ต้องระบุ MEDIA_ROOT เป็น argument แรก"
    exit 1
fi

# project root (override ได้ด้วย CF_ROOT สำหรับการทดสอบ)
ROOT="${CF_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
VAULT="$ROOT/content_vault"

# โฟลเดอร์ media หนักที่จะย้ายออก (databases/exports_csv ไม่ย้าย — อยู่กับโปรแกรม)
MEDIA_SUBDIRS=("generated_graphics" "downloaded_media" "logos")

# ทำให้ MEDIA_ROOT เป็น absolute path
mkdir -p "$MEDIA_ROOT"
MEDIA_ROOT="$(cd "$MEDIA_ROOT" && pwd)"

echo "=========================================================="
echo " 🗂️  ตั้งค่าโฟลเดอร์ media ของเครื่องนี้"
echo "    โปรแกรม : $VAULT"
echo "    Media   : $MEDIA_ROOT"
echo "=========================================================="

# กันชี้ media ไปทับในตัว content_vault เอง (จะ loop)
case "$MEDIA_ROOT/" in
    "$VAULT/"*) echo "❌ MEDIA_ROOT ต้องอยู่นอกโฟลเดอร์ content_vault"; exit 1 ;;
esac

count_files() { find "$1" -type f 2>/dev/null | wc -l | tr -d ' '; }

mkdir -p "$VAULT"

for sub in "${MEDIA_SUBDIRS[@]}"; do
    src="$VAULT/$sub"
    dst="$MEDIA_ROOT/$sub"
    mkdir -p "$dst"

    if [ -L "$src" ]; then
        # เป็น symlink อยู่แล้ว → แค่ชี้ใหม่ให้ถูก
        rm -f "$src"
        ln -s "$dst" "$src"
        echo "🔗 [$sub] เป็น symlink อยู่แล้ว — ชี้ไป $dst"
        continue
    fi

    if [ -d "$src" ]; then
        # โฟลเดอร์จริง → migrate ไป MEDIA_ROOT อย่างปลอดภัย
        echo "📦 [$sub] กำลังย้ายไฟล์ไป $dst ..."
        rsync -a "$src/" "$dst/"
        before="$(count_files "$src")"
        after="$(count_files "$dst")"
        if [ "$after" -lt "$before" ]; then
            echo "❌ [$sub] ย้ายไม่ครบ! ($before → $after) — ยกเลิก ไม่ลบของเดิม"
            exit 1
        fi
        rm -rf "$src"
        ln -s "$dst" "$src"
        echo "   ✅ [$sub] ย้าย $before ไฟล์ครบ + ทำ symlink แล้ว"
    else
        # ยังไม่มีโฟลเดอร์ (เครื่องใหม่) → สร้าง symlink เปล่า
        rm -f "$src" 2>/dev/null || true
        ln -s "$dst" "$src"
        echo "🆕 [$sub] สร้าง symlink ใหม่ → $dst"
    fi
done

# บันทึก path ไว้ (ค่าเฉพาะเครื่อง)
echo "$MEDIA_ROOT" > "$ROOT/media-location.txt"
echo "=========================================================="
echo " ✅ เสร็จ — บันทึกตำแหน่ง media ที่ media-location.txt"
echo "=========================================================="

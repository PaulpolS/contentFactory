#!/bin/bash

# ย้ายเข้าไปยังโฟลเดอร์ของสคริปต์นี้โดยอัตโนมัติ (ไม่ว่าจะรันจากที่ไหน)
cd "$(dirname "$0")"
ROOT="$(pwd)"

echo "=========================================================="
echo " 🚀 กำลังเริ่มระบบ Content Factory V2..."
echo "=========================================================="

# ----------------------------------------------------------------------
# 1) ล้าง Port ให้สะอาดจริง ๆ ก่อนเริ่ม (กันปัญหา "Port ชน / เปิดไม่ติด")
# ----------------------------------------------------------------------
free_port() {
    local port=$1
    local pids
    pids=$(lsof -ti tcp:"$port" 2>/dev/null)
    if [ -n "$pids" ]; then
        echo "   🔪 มี process ค้างอยู่บน port $port (PID: $pids) — กำลังปิด..."
        echo "$pids" | xargs kill -9 2>/dev/null
    fi
}

echo "🧹 กำลังล้าง process เก่าบน port 5005 และ 5173..."
# ปิดเฉพาะ process ของโปรเจกต์นี้ (ไม่ไปยุ่งกับ n8n / pm2 / อย่างอื่น)
pkill -9 -f "contentFactory/backend"  2>/dev/null
pkill -9 -f "contentFactory/frontend" 2>/dev/null
free_port 5005
free_port 5173

# รอจน port ว่างจริง (สูงสุด ~5 วินาที) ก่อนค่อยเริ่มใหม่
for i in $(seq 1 10); do
    if [ -z "$(lsof -ti tcp:5005 2>/dev/null)" ] && [ -z "$(lsof -ti tcp:5173 2>/dev/null)" ]; then
        break
    fi
    sleep 0.5
done
echo "   ✅ ล้างระบบและปิด process เก่าเรียบร้อยแล้ว"

# ----------------------------------------------------------------------
# 2) ลง dependency ใหม่ "อัตโนมัติเมื่อ package เปลี่ยน" (กันปัญหา Git อัปเดตมาแล้วพัง)
#    เทียบ checksum ของ package files ถ้าต่างจากครั้งก่อน = ลงใหม่
# ----------------------------------------------------------------------
ensure_deps() {
    local dir=$1
    local hashfile="$dir/node_modules/.cf_pkg_hash"
    local current=""
    if [ -f "$dir/package-lock.json" ]; then
        current=$(shasum "$dir/package-lock.json" | awk '{print $1}')
    else
        current=$(shasum "$dir/package.json" | awk '{print $1}')
    fi

    local previous=""
    [ -f "$hashfile" ] && previous=$(cat "$hashfile")

    if [ ! -d "$dir/node_modules" ] || [ "$current" != "$previous" ]; then
        echo "📦 [$dir] dependency มีการเปลี่ยนแปลง (หรือยังไม่ได้ลง) — กำลังติดตั้ง..."
        ( cd "$dir" && npm install ) || { echo "❌ npm install ใน $dir ล้มเหลว"; exit 1; }
        echo "$current" > "$hashfile"
        echo "   ✅ ติดตั้ง dependency ของ $dir เรียบร้อย"
    else
        echo "   ✅ [$dir] dependency เป็นปัจจุบันแล้ว ไม่ต้องลงใหม่"
    fi
}

ensure_deps "backend"
ensure_deps "frontend"

# ----------------------------------------------------------------------
# 3) เปิดเซิร์ฟเวอร์ในหน้าต่าง Terminal ใหม่
# ----------------------------------------------------------------------
run_in_new_terminal() {
    local title=$1
    local folder=$2
    local command=$3

    osascript <<EOF
        tell application "Terminal"
            activate
            do script "cd '$folder' && echo -n -e '\\\033]0;$title\\\007' && clear && $command"
        end tell
EOF
}

echo "⚙️ กำลังเปิดเซิร์ฟเวอร์หลังบ้าน (Backend API: Port 5005)..."
run_in_new_terminal "Content Factory - Backend" "$ROOT/backend" "npm run dev"

# หน่วงเวลาเล็กน้อยเพื่อให้ Backend เริ่มต้นก่อน
sleep 2

echo "💻 กำลังเปิดเซิร์ฟเวอร์หน้าบ้าน (Frontend UI: Port 5173)..."
run_in_new_terminal "Content Factory - Frontend" "$ROOT/frontend" "npm run dev"

# ----------------------------------------------------------------------
# 4) รอจนหน้าเว็บพร้อมจริง แล้วเปิดเบราว์เซอร์ให้อัตโนมัติ
# ----------------------------------------------------------------------
echo "🌐 กำลังรอให้หน้าเว็บพร้อม แล้วจะเปิดเบราว์เซอร์ให้เอง..."
for i in $(seq 1 30); do
    if curl -s -o /dev/null "http://localhost:5173"; then
        open "http://localhost:5173"
        echo "   ✅ เปิดเบราว์เซอร์เข้าโปรแกรมให้แล้ว"
        break
    fi
    sleep 0.5
done

echo "=========================================================="
echo " 🎉 เปิดระบบสำเร็จ!"
echo " 🔗 หน้าหลัก (Frontend): http://localhost:5173"
echo " 🔗 ระบบจัดการ (Backend): http://localhost:5005"
echo "=========================================================="
echo " ถ้าต้องการปิดระบบทั้งหมด ให้ดับเบิลคลิก StopApp.command"
echo "=========================================================="

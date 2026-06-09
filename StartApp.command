#!/bin/bash

# ย้ายเข้าไปยังโฟลเดอร์ของสคริปต์นี้โดยอัตโนมัติ (ไม่ว่าจะรันจากที่ไหน)
cd "$(dirname "$0")"

echo "=========================================================="
echo " 🚀 กำลังเริ่มระบบ Content Factory V2..."
echo "=========================================================="

# ตรวจสอบการติดตั้ง Node modules ของ Backend
if [ ! -d "backend/node_modules" ]; then
    echo "📦 ไม่พบโฟลเดอร์ node_modules ใน backend, กำลังติดตั้ง..."
    cd backend && npm install && cd ..
fi

# ตรวจสอบการติดตั้ง Node modules ของ Frontend
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 ไม่พบโฟลเดอร์ node_modules ใน frontend, กำลังติดตั้ง..."
    cd frontend && npm install && cd ..
fi

# ฟังก์ชันสั่งเปิด Terminal หน้าต่างใหม่เพื่อรันเซิร์ฟเวอร์
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
run_in_new_terminal "Content Factory - Backend" "$(pwd)/backend" "npm run dev"

# หน่วงเวลาเล็กน้อยเพื่อให้ Backend เริ่มต้นก่อน
sleep 2

echo "💻 กำลังเปิดเซิร์ฟเวอร์หน้าบ้าน (Frontend UI: Port 5173)..."
run_in_new_terminal "Content Factory - Frontend" "$(pwd)/frontend" "npm run dev"

echo "=========================================================="
echo " 🎉 เปิดระบบสำเร็จ!"
echo " 🔗 หน้าหลัก (Frontend): http://localhost:5173"
echo " 🔗 ระบบจัดการ (Backend): http://localhost:5005"
echo "=========================================================="
echo " สามารถปิดหน้าต่างนี้ได้เลย ตัวระบบแยกจะรันอยู่ในอีก 2 หน้าต่างหลัก"
echo "=========================================================="

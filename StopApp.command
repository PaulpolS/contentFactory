#!/bin/bash

# ปิดระบบ Content Factory V2 ให้สะอาด (กัน process ค้างบน port)
cd "$(dirname "$0")"

echo "=========================================================="
echo " 🛑 กำลังปิดระบบ Content Factory V2..."
echo "=========================================================="

free_port() {
    local port=$1
    local pids
    pids=$(lsof -ti tcp:"$port" 2>/dev/null)
    if [ -n "$pids" ]; then
        echo "   🔪 ปิด process บน port $port (PID: $pids)"
        echo "$pids" | xargs kill -9 2>/dev/null
    fi
}

# ปิดเฉพาะ process ของโปรเจกต์นี้
pkill -9 -f "contentFactory/backend"  2>/dev/null
pkill -9 -f "contentFactory/frontend" 2>/dev/null
free_port 5005
free_port 5173

echo "   ✅ ปิดระบบเรียบร้อยแล้ว — port 5005 และ 5173 ว่างพร้อมใช้งาน"
echo "=========================================================="
echo " ปิดหน้าต่างนี้ได้เลย"
echo "=========================================================="

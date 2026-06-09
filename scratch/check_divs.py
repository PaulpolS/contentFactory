import os
import re

bundle_path = "frontend/dist/assets/index-DQydKLwf.js"
if not os.path.exists(bundle_path):
    print("Bundle not found")
    exit(1)

with open(bundle_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Let's search for "เลือกทั้งหมดเพื่อสร้างโพสรูป" or similar Thai strings in the bundle
targets = ["เลือกทั้งหมดเพื่อสร้างโพสรูป", "สั่ง AI เขียนบทความและพาดหัว", "พิมพ์คำค้นหาโพสต์", "ยังไม่มีคอนเทนต์ที่นำเข้ามาในห้องควบคุมดีไซน์"]

for t in targets:
    pos = js.find(t)
    if pos != -1:
        print(f"Found target '{t}' at position {pos}")
        # Print 500 characters before and 1500 characters after
        start = max(0, pos - 800)
        end = min(len(js), pos + 1800)
        print("--- CONTEXT ---")
        print(js[start:end])
        print("====================================")
    else:
        print(f"Target '{t}' not found")

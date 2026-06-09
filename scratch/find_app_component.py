import os
import re

js_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/dist/assets/index-Drf6c1vB.js"

with open(js_path, "r", encoding="utf-8") as f:
    content = f.read()

# Let's search for "function cn" or similar definition pattern
# Minified function definitions are often like "function cn(" or "const cn=" or "cn=" or "let cn="
# Since cn is the main App component, it might contain a lot of state hooks like "const [activeTab, setActiveTab]"
# Let's search for "function cn("
matches = []
for pattern in [r"function cn\(", r"const cn\s*=", r"let cn\s*=", r"var cn\s*="]:
    for m in re.finditer(pattern, content):
        matches.append((m.start(), m.group(0)))

print(f"Found {len(matches)} matches for cn definition:")
for pos, matched in matches:
    print(f"  Pos: {pos} | Matched: {matched}")
    # Print the next 300 characters
    print(f"  Context: {content[pos:pos+300]!r}\n")

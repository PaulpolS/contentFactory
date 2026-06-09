with open("scratch/canvas_js_raw.txt", "r", encoding="utf-8") as f:
    content = f.read()

# Let's find the logs box code: e.g. "AI Copywriting Logs" or "🙈 ซ่อน Log"
pos = content.find("🙈 ซ่อน Log")
if pos != -1:
    print(f"Found logs box at index {pos}")
    # Let's print the next 20,000 characters to see what comes next
    snippet = content[pos:pos+30000]
    with open("scratch/canvas_js_after_logs.txt", "w", encoding="utf-8") as out_f:
        out_f.write(snippet)
    print("Saved to scratch/canvas_js_after_logs.txt")
else:
    print("Keyword not found")

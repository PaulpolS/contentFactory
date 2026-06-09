with open("scratch/canvas_js_raw.txt", "r", encoding="utf-8") as f:
    content = f.read()

# Let's find "🙈 ซ่อน Log"
pos = content.find("🙈 ซ่อน Log")
if pos != -1:
    print(f"Found keyword at index {pos}")
    # Let's extract 70,000 characters
    snippet = content[pos:pos+70000]
    with open("scratch/canvas_js_rest.txt", "w", encoding="utf-8") as out_f:
        out_f.write(snippet)
    print("Saved to scratch/canvas_js_rest.txt")
else:
    print("Keyword not found")

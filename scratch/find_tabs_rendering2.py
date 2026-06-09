with open("scratch/js_end.js", "r", encoding="utf-8") as f:
    content = f.read()

start = 111500
end = 113500
print(f"Extracting from {start} to {end} (size: {len(content)})")
snippet = content[start:end]
with open("scratch/tabs_panel_minified.js", "w", encoding="utf-8") as out:
    out.write(snippet)
print("Saved snippet to scratch/tabs_panel_minified.js")

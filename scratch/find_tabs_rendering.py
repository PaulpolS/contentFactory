with open("scratch/js_end.js", "r", encoding="utf-8") as f:
    content = f.read()

pos = content.find('SettingsPortal')
if pos == -1:
    pos = content.find('`settings`')

if pos != -1:
    print(f"Found at {pos}")
    snippet = content[pos - 1000 : pos + 3000]
    with open("scratch/tabs_render_minified.js", "w", encoding="utf-8") as out:
        out.write(snippet)
    print("Saved snippet to scratch/tabs_render_minified.js")
else:
    print("Not found")

import os
import re

in_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/canvas_tab_jsx.js"
out_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/canvas_tab_readable.js"

if os.path.exists(in_path):
    with open(in_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Let's do some regex replacements to make it more readable
    # 1. Replace (0,Y.jsx) / (0,Y.jsxs) / (0, Y.jsx)
    content = re.sub(r'\(0,\s*[A-Za-z0-9_]+\.jsx\)', 'JSX', content)
    content = re.sub(r'\(0,\s*[A-Za-z0-9_]+\.jsxs\)', 'JSXS', content)
    
    # 2. Add some indentation and newlines around JSX/JSXS calls
    # Let's break lines before JSX and JSXS
    content = content.replace("JSX(", "\n  JSX(")
    content = content.replace("JSXS(", "\n  JSXS(")
    content = content.replace("children:", "\n    children:")
    content = content.replace("className:", "\n    className:")
    content = content.replace("onClick:", "\n    onClick:")
    content = content.replace("onChange:", "\n    onChange:")
    content = content.replace("value:", "\n    value:")
    
    with open(out_path, "w", encoding="utf-8") as out:
        out.write(content)
    print(f"Saved readable minified JS to {out_path}")
else:
    print("canvas_tab_jsx.js not found")

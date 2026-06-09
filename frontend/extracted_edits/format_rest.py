import re

with open("scratch/canvas_js_rest.txt", "r", encoding="utf-8") as f:
    content = f.read()

# Let's replace common React/JSX transpiled markers with formatted equivalents
# for easier reading
formatted = content
# Add newlines after tags and braces
formatted = formatted.replace("children:[", "children:[\n")
formatted = formatted.replace("({", "(\n{")
formatted = formatted.replace("})", "}\n)")
formatted = formatted.replace("},", "},\n")
formatted = formatted.replace("],", "],\n")
formatted = formatted.replace("children:", "\nchildren:")
formatted = formatted.replace("className:", "\nclassName:")
formatted = formatted.replace("style:", "\nstyle:")
formatted = formatted.replace("onClick:", "\nonClick:")

# Let's write out the formatted text
with open("scratch/canvas_js_rest_formatted.txt", "w", encoding="utf-8") as out_f:
    out_f.write(formatted)

print("Formatted successfully! Saved to scratch/canvas_js_rest_formatted.txt")

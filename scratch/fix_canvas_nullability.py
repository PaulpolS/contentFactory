with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add X icon to lucide-react imports
content = content.replace("  Sparkles\n}", "  Sparkles,\n  X\n}")

# 2. Fix nullability of canvasSelectedItem.metadata
# Let's replace the occurrences:
replacements = {
    "canvasSelectedItem.metadata?.copywriting": "canvasSelectedItem?.metadata?.copywriting",
    "canvasSelectedItem.metadata.copywriting.caption": "canvasSelectedItem?.metadata?.copywriting?.caption",
    "canvasSelectedItem.metadata?.copywriting?.headlines": "canvasSelectedItem?.metadata?.copywriting?.headlines",
    "canvasSelectedItem.metadata?.copywriting?.headline_3line": "canvasSelectedItem?.metadata?.copywriting?.headline_3line",
    "canvasSelectedItem.metadata.copywriting.headline_3line": "canvasSelectedItem?.metadata?.copywriting?.headline_3line",
    "canvasSelectedItem.metadata?.copywriting?.comments": "canvasSelectedItem?.metadata?.copywriting?.comments",
}

for target, rep in replacements.items():
    if target in content:
        content = content.replace(target, rep)
        print(f"Replaced '{target}' with '{rep}'")

with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "w", encoding="utf-8") as f:
    content = f.write(content)

print("Nullability fix completed!")

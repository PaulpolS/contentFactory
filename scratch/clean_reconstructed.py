import re

file_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/reconstructed_App_final.tsx"
out_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/reconstructed_App_cleaned.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove python code segments
# Python code blocks like:
# if target_card_footer in content:
#     content = content.replace(target_card_footer, replacement_card_footer)
#     print("Injected inline card editor and action buttons!")
python_pattern = r'if target_card_footer in content:[\s\S]*?print\("Injected inline card editor and action buttons!"\)'
content, count = re.subn(python_pattern, "", content)
print(f"Removed {count} python statements.")

# 2. Fix the escaped backtick syntax error
# a.download = `content_export_${new Date().toISOString().slice(0,10)}.csv\`;
content = content.replace(
    "a.download = `content_export_${new Date().toISOString().slice(0,10)}.csv\\`;",
    "a.download = `content_export_${new Date().toISOString().slice(0,10)}.csv`;"
)

with open(out_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Saved cleaned version to {out_path}")

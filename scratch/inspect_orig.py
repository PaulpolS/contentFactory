import os

orig_path = "/Users/paulpolsulintaboon/Documents/GitHub/BulkVideoCreatorApp-Clean/src/components/video/AutomatedVideoGeneratorTab.tsx"

with open(orig_path, "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

print("Original File Inspection:")
print("Contains \\ufffd:", '\ufffd' in content)
print("Contains ?: ", '?' in content)

# Check some lines from the beginning of KIEAI_VOICES or HEADLINE_PRESETS
print("\nFirst 10 lines of HEADLINE_PRESETS in original:")
start_idx = content.find("const HEADLINE_PRESETS")
if start_idx != -1:
    print(content[start_idx:start_idx+800])
else:
    print("HEADLINE_PRESETS not found")

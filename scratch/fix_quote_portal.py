path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/QuoteVideoPortal.tsx"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

target_str = """      const res = await fetch('/api/pick-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON          {/* Section 1: Template and Background setup */}"""

replacement_str = """      const res = await fetch('/api/pick-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'เลือกโฟลเดอร์สำหรับบันทึกวิดีโอคำคม' })
      });
      const data = await res.json();
      if (data.success && data.dir) {
        setOutputPath(data.dir);
        localStorage.setItem('custom_output_folder', data.dir);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <>
      {/* Section 1: Template and Background setup */}"""

if target_str in content:
    content = content.replace(target_str, replacement_str)
    print("Successfully replaced target string in QuoteVideoPortal.tsx!")
else:
    # Let's try matching with minor spacing differences
    # Let's search for "body: JSON" in the file
    idx = content.find("body: JSON")
    if idx != -1:
        print(f"Found 'body: JSON' at index {idx}. Replacing manually...")
        # Replace from 'const res = await fetch('/api/pick-folder'' to the next '{/* Section 1:''
        start_pick = content.rfind("const res = await fetch('/api/pick-folder'", 0, idx)
        end_pick = content.find("{/* Section 1:", idx)
        if start_pick != -1 and end_pick != -1:
            content = content[:start_pick] + replacement_str + content[end_pick + len("{/* Section 1:"):]
            print("Successfully replaced with flexible match!")
        else:
            print("Failed to find boundaries for replacement.")
    else:
        print("WARNING: 'body: JSON' not found in QuoteVideoPortal.tsx")

# Write it back
with open(path, "w", encoding="utf-8") as f:
    f.write(content)

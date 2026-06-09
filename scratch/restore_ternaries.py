import re

def fix_file_ternaries(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 1. Fix 'touches' in e / ev ternaries
    content = re.sub(r"'touches'\s+in\s+(\w+)\s+(\w+)\.touches", r"'touches' in \1 ? \2.touches", content)
    
    # 2. Fix variable  'string' : 'string' patterns
    # e.g., isActive  'bg-indigo-500/10 border-l-2 border-l-indigo-500' : 'hover:bg-white/5'
    content = re.sub(r"(\w+)\s{2,}('[^']*'\s*:\s*'[^']*')", r"\1 ? \2", content)
    content = re.sub(r"(\w+)\s{2,}(\`[^\`]*\`\s*:\s*\'[^\']*\')", r"\1 ? \2", content)
    content = re.sub(r"(\w+)\s{2,}(\`[^\`]*\`\s*:\s*\`[^\`]*\`)", r"\1 ? \2", content)
    content = re.sub(r"(\w+)\s{2,}(\`[^\`]*\`\s*:\s*\"[^\"]*\")", r"\1 ? \2", content)
    content = re.sub(r"(\w+)\s{2,}(\"[^\"]*\"\s*:\s*\"[^\"]*\")", r"\1 ? \2", content)
    
    # 3. Fix specific known lines:
    # e.g., isExpanded  item.script :
    content = content.replace("isExpanded  item.script", "isExpanded ? item.script")
    # e.g., isExpanded  'ย่อบท' : 'อ่านบท'
    content = content.replace("isExpanded  'ย่อบท'", "isExpanded ? 'ย่อบท'")
    # e.g., playingHistoryId === item.id  '⏸️' : '▶️'
    content = content.replace("playingHistoryId === item.id  '⏸️'", "playingHistoryId === item.id ? '⏸️'")
    # e.g., isGeneratingHeadline  '...' : '...'
    content = content.replace("isGeneratingHeadline  'กำลั'", "isGeneratingHeadline ? 'กำลัง'")
    content = content.replace("isGeneratingHeadline  'กำลั'", "isGeneratingHeadline ? 'กำลัง'")
    
    # 4. Fix other general 'e  e.touches' pattern
    content = re.sub(r"'touches'\s+in\s+(\w+)\s+(\w+)\.touches", r"'touches' in \1 ? \2.touches", content)
    content = content.replace("'touches' in e  e.touches", "'touches' in e ? e.touches")
    content = content.replace("'touches' in ev  ev.touches", "'touches' in ev ? ev.touches")
    
    # 5. Fix `isActive  ` in VerticalVideoSuitePortal
    content = content.replace("isActive  'bg-indigo-500/10", "isActive ? 'bg-indigo-500/10")
    content = content.replace("isActive  `bg-indigo-500/10", "isActive ? `bg-indigo-500/10")
    content = content.replace("isExpanded  item.script.substring", "isExpanded ? item.script.substring")
    content = content.replace("isVoiceGenerated  (", "isVoiceGenerated ? (")
    content = content.replace("isGeneratingVoice  (", "isGeneratingVoice ? (")
    content = content.replace("isGeneratingScript  '✍'", "isGeneratingScript ? '✍'")
    content = content.replace("isGeneratingScript  '✍️'", "isGeneratingScript ? '✍️'")
    content = content.replace("isGeneratingVoice  '⏳'", "isGeneratingVoice ? '⏳'")
    
    # 6. Fix `sourceFolder  ` in VerticalVideoSuitePortal
    content = content.replace("sourceFolder  `Footage:", "sourceFolder ? `Footage:")
    content = content.replace("outputFolder  `บันทึกที:", "outputFolder ? `บันทึกที:")
    content = content.replace("outputFolder  `บันทึกที:", "outputFolder ? `บันทึกที:")
    content = content.replace("outputFolder  `บันทึก:", "outputFolder ? `บันทึก:")
    
    # 7. Fix `kind === 'source'  ` patterns
    content = content.replace("kind === 'source'  'เเลือก'", "kind === 'source' ? 'เลือก'")
    content = content.replace("kind === 'source'  'เต้นทการง'", "kind === 'source' ? 'ต้นทาง'")
    content = content.replace("kind === 'source'  'เปเลการยทการง'", "kind === 'source' ? 'ปลายทาง'")
    content = content.replace("kind === 'source'  'ต้นทาง'", "kind === 'source' ? 'ต้นทาง'")
    content = content.replace("kind === 'source'  'ปลายทาง'", "kind === 'source' ? 'ปลายทาง'")
    
    # 8. Fix general optional chaining missing dot/question marks
    # e.g., onLog. / addLog. / localStorage.getItem()
    content = content.replace("onLog.(", "onLog?.(")
    content = content.replace("addLog.(", "addLog?.(")
    content = content.replace("createData.data.taskId", "createData?.data?.taskId")
    content = content.replace("createData.taskId", "createData?.taskId")
    content = content.replace("pollData.data.state", "pollData?.data?.state")
    content = content.replace("pollData.state.toLowerCase()", "pollData?.state?.toLowerCase()")
    content = content.replace("pollData.data.resultJson", "pollData?.data?.resultJson")
    content = content.replace("pollData.resultJson", "pollData?.resultJson")
    content = content.replace("pollData.data.failMsg", "pollData?.data?.failMsg")
    content = content.replace("pollData.failMsg", "pollData?.failMsg")
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print(f"Fixed ternaries in {file_path}")

# Run on both files
fix_file_ternaries("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx")
fix_file_ternaries("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/QuoteVideoPortal.tsx")

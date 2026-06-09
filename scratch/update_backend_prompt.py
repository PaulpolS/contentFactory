with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/backend/src/routes/vault.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Target the prompt block exactly
target_prompt = """      const prompt = `
You are an expert copywriter for Thai tech community pages.
Analyze the following article/content:
Title: ${content.title}
Content: ${content.raw_content || ''}
${existingCopywritingContext}
${customInstructions}
Produce a response that is a VALID, parsable JSON object containing the following structure:
{
  "caption": "A captivating, engaging post caption in Thai, with emojis and hashtags. Make it interesting and easy to read, perfect for Facebook/LinkedIn/Twitter.",
  "comments": [
    "Paragraph 1 for comment section (under the post) to add context or start conversation.",
    "Paragraph 2 for comment section.",
    "Paragraph 3 for comment section."
  ],
  "headlines": [
    "Headline option 1 (short, punchy, viral Thai headline)",
    "Headline option 2",
    "Headline option 3",
    "Headline option 4",
    "Headline option 5"
  ],
  "headline_3line": [
    "First line (catchy keyword, e.g. สีแดง 'ข่าวด่วน!')",
    "Second line (main statement, e.g. สีขาว 'เปิดตัวระบบ AI')",
    "Third line (sub-statement/callout, e.g. สีเหลือง 'ช่วยเขียนโค้ดอัตโนมัติ')"
  ]
}

Return ONLY the JSON string. Do not wrap in markdown or any other text.
`;"""

replacement_prompt = """      const prompt = `
You are an expert copywriter for Thai tech, AI, and business marketing community pages.
Analyze the following article/content:
Title: ${content.title}
Content: ${content.raw_content || ''}
${existingCopywritingContext}
${customInstructions}

== MANDATORY STYLE RULES FOR THAI 3-LINE HEADLINES (headline_3line) ==
Produce an extremely engaging, high-converting Thai 3-line headline following this exact, highly viral formula:
- Line 1 (Bold Achievement/Goal/Outcome & Speed): Focus on massive achievements, income, high-value outcomes, or speed. e.g. "สร้างรายได้หลักล้านต่อเดือนด้วยตัวคนเดียว" or "เริ่มสร้างธุรกิจของตัวเองได้ภายใน 30 วัน" or "บริการออกแบบเว็บไซต์แบบ 3D" or "สร้างรายได้หลักล้านต่อเดือนด้วยตัวคนเดียว"
- Line 2 (Mechanism/Technology/AI Tool): Explains the "how" (mechanism/technology) in a highly viral way. e.g. "โดยใช้แค่ AI ในการให้บริการลูกค้าทั้งหมด" or "ด้วยการใช้เพียงแค่ Claude AI Pro เท่านั้น" or "จากการสร้าง app กว่า 35 ตัวด้วย AI"
- Line 3 (Value/Strategy/Secrets/Framework Promise): Delivers a powerful concluding promise of a comprehensive strategy, summary, secrets, or framework. e.g. "สรุปกลยุทธ์ทั้งหมดที่เขาทำตั้งแต่เริ่ม" or "สรุปออกมาเป็น framework ที่สามารถทำตามได้" or "และนี่คือวิธีและเคล็ดลับทั้งหมดที่เขาทำ" or "Meta ธุรกิจแบบใหม่ที่เรียกว่า Solo Agency"

Produce a response that is a VALID, parsable JSON object containing the following structure:
{
  "caption": "A captivating, engaging post caption in Thai, with emojis and hashtags. Make it interesting and easy to read, perfect for Facebook/LinkedIn/Twitter.",
  "comments": [
    "Paragraph 1 for comment section (under the post) to add context or start conversation.",
    "Paragraph 2 for comment section.",
    "Paragraph 3 for comment section."
  ],
  "headlines": [
    "Headline option 1 (short, punchy, viral Thai headline)",
    "Headline option 2",
    "Headline option 3",
    "Headline option 4",
    "Headline option 5"
  ],
  "headline_3line": [
    "Line 1 (e.g. 'เริ่มสร้างธุรกิจของตัวเองได้ภายใน 30 วัน')",
    "Line 2 (e.g. 'ด้วยการใช้เพียงแค่ Claude AI Pro เท่านั้น')",
    "Line 3 (e.g. 'และนี่คือวิธีและเคล็ดลับทั้งหมดที่เขาทำ')"
  ]
}

Return ONLY the JSON string. Do not wrap in markdown or any other text.
`;"""

if target_prompt in content:
    content = content.replace(target_prompt, replacement_prompt)
    print("Backend AI spawner prompt successfully updated with viral 3-line patterns!")
else:
    # Try with flexible whitespace
    import re
    # Let's search using broad regex
    pattern = re.compile(
        r"const\s+prompt\s*=\s*`\s*You\s+are\s+an\s+expert\s+copywriter.*?headline_3line.*?Return\s+ONLY\s+the\s+JSON\s+string\..*?`;",
        re.DOTALL
    )
    match = pattern.search(content)
    if match:
        content = content.replace(match.group(0), replacement_prompt)
        print("Backend AI spawner prompt successfully updated via Regex!")
    else:
        print("Failed to find prompt block in backend vault.ts")

with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/backend/src/routes/vault.ts", "w", encoding="utf-8") as f:
    f.write(content)

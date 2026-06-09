import re

filepath = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

tag_re = re.compile(r"<(/?[a-zA-Z0-9_\-]+)(?:\s+[^>]*?)?>")

stack = []

for idx in range(1300, len(lines)):
    line_num = idx + 1
    line_text = lines[idx]
    
    # Strip comments to avoid false matches
    stripped = re.sub(r"{\s*/\*.*?\*/\s*}", "", line_text)
    stripped = re.sub(r"//.*", "", stripped)
    
    # Find all tags in line
    for match in tag_re.finditer(stripped):
        tag_name = match.group(1)
        full_match = match.group(0)
        
        # Self-closing tags or void tags
        if full_match.endswith("/>") or tag_name in ["img", "input", "br", "hr", "link", "meta"]:
            continue
            
        if tag_name.startswith("/"):
            tag_pure = tag_name[1:]
            if tag_pure in ["div", "section", "main", "aside", "header", "footer", "button", "select", "option", "span", "p", "h1", "h2", "h3", "label", "form"]:
                # Pop until we match tag_pure or stack is empty
                found = False
                temp_popped = []
                while stack:
                    popped_tag, popped_line = stack.pop()
                    if popped_tag == tag_pure:
                        found = True
                        break
                    else:
                        temp_popped.append((popped_tag, popped_line))
                if found:
                    pass # Match found!
                else:
                    # Restore stack and print error
                    stack.extend(reversed(temp_popped))
                    print(f"L{line_num}: ERROR! Closing tag </{tag_pure}> with no matching open tag! Current stack top: {stack[-1] if stack else 'empty'}")
        else:
            if tag_name in ["div", "section", "main", "aside", "header", "footer", "button", "select", "option", "span", "p", "h1", "h2", "h3", "label", "form"]:
                stack.append((tag_name, line_num))

print("\n--- Remaining unclosed tags in stack ---")
for t, l in stack:
    print(f"L{l}: Unclosed <{t}>")
print(f"Total unclosed: {len(stack)}")

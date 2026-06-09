with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Let's count how many times we see `activeTab === 'canvas'` and look at the block surrounding it.
# We can also parse the JSX structure using a simple stack in python.
import re

# Let's search for unbalanced curly braces and parentheses
# We'll tokenize by { } ( ) <tagName </tagName
tokens = re.findall(r"\{|\}|\(|\)|<\/?[a-zA-Z0-9_\-]+|-->", content)

stack = []
line_nums = []
lines = content.split('\n')

# Let's trace curly braces and parenthesis line-by-line
p_stack = [] # stack of (line, char)
c_stack = [] # stack of {line, char}

for idx, line in enumerate(lines):
    line_num = idx + 1
    for char_idx, char in enumerate(line):
        if char == '(':
            p_stack.append((line_num, char_idx))
        elif char == ')':
            if p_stack:
                p_stack.pop()
            else:
                print(f"Extra closing parenthesis on line {line_num}:{char_idx}")
        elif char == '{':
            c_stack.append((line_num, char_idx))
        elif char == '}':
            if c_stack:
                c_stack.pop()
            else:
                print(f"Extra closing curly brace on line {line_num}:{char_idx}")

print("Remaining open parentheses count:", len(p_stack))
if p_stack:
    print("First 10 open parentheses:")
    for l, c in p_stack[:10]:
        print(f"  Line {l}:{c} -> {lines[l-1]}")

print("Remaining open curly braces count:", len(c_stack))
if c_stack:
    print("First 10 open curly braces:")
    for l, c in c_stack[:10]:
        print(f"  Line {l}:{c} -> {lines[l-1]}")

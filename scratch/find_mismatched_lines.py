with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

p_stack = []
c_stack = []

for idx, line in enumerate(lines):
    line_num = idx + 1
    for char_idx, char in enumerate(line):
        if char == '(':
            p_stack.append((line_num, char_idx))
        elif char == ')':
            if p_stack:
                p_stack.pop()
            else:
                print(f"Extra ) on line {line_num}:{char_idx} | {line.strip()}")
        elif char == '{':
            c_stack.append((line_num, char_idx))
        elif char == '}':
            if c_stack:
                c_stack.pop()
            else:
                print(f"Extra }} on line {line_num}:{char_idx} | {line.strip()}")

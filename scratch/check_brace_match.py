import os
import re

def check_file(filepath):
    print(f"Checking {filepath}...")
    if not os.path.exists(filepath):
        print("  File does not exist.")
        return
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Track line numbers
    lines = content.splitlines()
    
    # We want to trace curly braces and parenthesis nesting
    curly_stack = []
    paren_stack = []
    
    # Clean strings and comments to avoid counting braces inside them
    # Simple state machine to parse and count
    in_string = False
    string_char = None
    in_line_comment = False
    in_block_comment = False
    in_regex = False
    
    i = 0
    length = len(content)
    line_num = 1
    col_num = 1
    
    # Track brackets
    curly_balance = 0
    paren_balance = 0
    
    while i < length:
        char = content[i]
        
        # Newline tracking
        if char == '\n':
            line_num += 1
            col_num = 1
            in_line_comment = False
            i += 1
            continue
            
        if in_line_comment:
            i += 1
            col_num += 1
            continue
            
        if in_block_comment:
            if char == '*' and i + 1 < length and content[i+1] == '/':
                in_block_comment = False
                i += 2
                col_num += 2
            else:
                i += 1
                col_num += 1
            continue
            
        if in_string:
            if char == '\\':
                # Skip escaped char
                i += 2
                col_num += 2
            elif char == string_char:
                in_string = False
                i += 1
                col_num += 1
            else:
                i += 1
                col_num += 1
            continue
            
        # Check comment start
        if char == '/' and i + 1 < length:
            if content[i+1] == '/':
                in_line_comment = True
                i += 2
                col_num += 2
                continue
            elif content[i+1] == '*':
                in_block_comment = True
                i += 2
                col_num += 2
                continue
                
        # Check string start
        if char in ['"', "'", '`']:
            in_string = True
            string_char = char
            i += 1
            col_num += 1
            continue
            
        # Brace tracking
        if char == '{':
            curly_balance += 1
            curly_stack.append((line_num, col_num))
        elif char == '}':
            curly_balance -= 1
            if curly_stack:
                curly_stack.pop()
            else:
                print(f"  Unmatched '}}' at line {line_num}, col {col_num}")
        elif char == '(':
            paren_balance += 1
            paren_stack.append((line_num, col_num))
        elif char == ')':
            paren_balance -= 1
            if paren_stack:
                paren_stack.pop()
            else:
                print(f"  Unmatched ')' at line {line_num}, col {col_num}")
                
        i += 1
        col_num += 1
        
    print(f"  Final balances - Curly: {curly_balance}, Paren: {paren_balance}")
    if curly_stack:
        print(f"  Open curlies remaining: {len(curly_stack)} (First opened at line {curly_stack[0][0]}, col {curly_stack[0][1]})")
        # Print lines around the first open curly
        start_line = max(1, curly_stack[0][0] - 2)
        end_line = min(len(lines), curly_stack[0][0] + 5)
        print("  Code around first open curly:")
        for idx in range(start_line - 1, end_line):
            print(f"    L{idx+1}: {lines[idx]}")
            
    if paren_stack:
        print(f"  Open parens remaining: {len(paren_stack)} (First opened at line {paren_stack[0][0]}, col {paren_stack[0][1]})")

# List files to check
files_to_check = [
    "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx",
    "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/App_backup_strict.tsx",
    "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/reconstructed_App_cleaned.tsx",
    "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/reconstructed_App_raw.tsx",
    "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/reconstructed_App_strict.tsx"
]

for fp in files_to_check:
    check_file(fp)
    print("-" * 50)

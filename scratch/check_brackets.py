with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Let's count braces and parentheses in the range 1700 to 2100
open_paren = 0
close_paren = 0
open_curly = 0
close_curly = 0

print("Tracing brackets line by line:")
for idx in range(1750, 2060):
    line_num = idx + 1
    l = lines[idx]
    
    # Count occurrences
    p_op = l.count('(')
    p_cl = l.count(')')
    c_op = l.count('{')
    c_cl = l.count('}')
    
    open_paren += p_op
    close_paren += p_cl
    open_curly += c_op
    close_curly += c_cl
    
    if 'canvasSelectedItem' in l or 'savedLogos' in l or 'copywriting' in l or 'ratio' in l or ')}' in l:
        print(f"L{line_num}: parens={open_paren - close_paren}, curlies={open_curly - close_curly} | {l.strip()}")

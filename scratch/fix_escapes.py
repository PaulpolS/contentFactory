with open("frontend/src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Let's search for escaped backticks in string templates
# Like .csv\` or similar
print("Initial .csv\\` count:", content.count('.csv\\`'))
print("Initial .csv\\\\\\` count:", content.count('.csv\\\\`'))

fixed_content = content
fixed_content = fixed_content.replace('.csv\\`', '.csv`').replace('.csv\\\\`', '.csv`')
fixed_content = fixed_content.replace('.csv\\\\\\`', '.csv`')

# Let's search for specific lines like line 5208
# a.download = `content_export_${new Date().toISOString().slice(0,10)}.csv\`;
# should be:
# a.download = `content_export_${new Date().toISOString().slice(0,10)}.csv`;

# Let's search for any trailing backslash followed by backticks or quotes at the end of lines
fixed_content = fixed_content.replace('csv\\`', 'csv`').replace('csv\\\\`', 'csv`')

# Also search for any stray backslashes escaping quotes inside JSX or JS strings that are invalid
# Let's write the fixed content back
with open("frontend/src/App.tsx", "w", encoding="utf-8") as f:
    f.write(fixed_content)

print("Finished fixing escapes.")

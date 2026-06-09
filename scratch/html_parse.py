from html.parser import HTMLParser
import re

class JSXTagTracker(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.errors = []
        
    def handle_starttag(self, tag, attrs):
        # We only care about standard lowercase layout elements like div, section, header, footer, etc.
        if tag in ["div", "section", "main", "aside", "header", "footer"]:
            # Check if this is self-closing
            # html.parser handles self-closing in handle_startendtag, but in case it's parsed as start tag
            # We can check attrs for self-closing or trust the parser.
            self.stack.append((tag, self.getpos()))
            # print(f"Push {tag} at line {self.getpos()[0]}")

    def handle_endtag(self, tag):
        if tag in ["div", "section", "main", "aside", "header", "footer"]:
            if self.stack:
                popped_tag, popped_pos = self.stack.pop()
                if popped_tag != tag:
                    self.errors.append(f"Mismatched tag: opened <{popped_tag}> at L{popped_pos[0]} but closed with </{tag}> at L{self.getpos()[0]}")
                # else:
                #     print(f"Popped {tag} at line {self.getpos()[0]} (opened at L{popped_pos[0]})")
            else:
                self.errors.append(f"Unexpected closing tag </{tag}> at L{self.getpos()[0]} with empty stack")

    def handle_startendtag(self, tag, attrs):
        # Self closing tag, do nothing
        pass

filepath = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Extract lines from 1603 to 3310 (0-indexed 1602 to 3309)
tab3_lines = lines[1602:3310]
tab3_content = "".join(tab3_lines)

# Strip out JS curly-brace expressions to avoid confusing the HTML parser
# We can do a simple replacement of {...} with empty string if they are on a single line
# Or just strip comments and common JS lines
clean_lines = []
for idx, line in enumerate(tab3_lines):
    line_num = 1603 + idx
    # Strip inline comments
    l_clean = re.sub(r"{\s*/\*.*?\*/\s*}", "", line)
    l_clean = re.sub(r"//.*", "", l_clean)
    
    # Strip out lines that contain purely JS logic or are not tags
    # If a line doesn't have '<' or '>', let's replace it with spaces to preserve line numbers
    if '<' not in l_clean and '>' not in l_clean:
        l_clean = "\n"
    
    clean_lines.append(l_clean)

clean_content = "".join(clean_lines)

tracker = JSXTagTracker()
try:
    tracker.feed(clean_content)
except Exception as e:
    print(f"Parser error: {e}")

print("\n--- Errors found ---")
for err in tracker.errors:
    print(err)

print("\n--- Remaining stack ---")
if not tracker.stack:
    print("None! All tags matched.")
else:
    for tag, pos in tracker.stack:
        # html.parser pos is 1-indexed relative to clean_content, so we adjust to absolute App.tsx lines
        abs_line = 1602 + pos[0]
        print(f"Unclosed <{tag}> opened at L{abs_line}")

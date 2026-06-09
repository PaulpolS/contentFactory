import ast
import json

path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/App_tsx_step82_original.tsx"

with open(path, "r", encoding="utf-8") as f:
    text = f.read()

print(f"Text length: {len(text)}")
print(f"Start: {text[:100]}")
print(f"End: {text[-100:]}")

# Try loading with json.loads and custom decoder or ast.literal_eval
try:
    # If it is double quoted string, literal_eval might work
    val = ast.literal_eval(text)
    print(f"literal_eval success! len: {len(val)}")
    with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/App_tsx_step82_decoded.tsx", "w", encoding="utf-8") as out:
        out.write(val)
    print("Saved decoded file to scratch/App_tsx_step82_decoded.tsx")
except Exception as e:
    print(f"literal_eval failed: {e}")

try:
    # Try custom parsing if it failed due to escapes like \u or similar
    # Sometimes json.loads fails on raw backslashes
    # Let's try to unescape manually or clean it up
    cleaned = text
    # Replace invalid escapes or use unicode_escape
    # But since it's a python string literal, let's try codecs
    import codecs
    # If the file starts with " and ends with "
    if text.startswith('"') and text.endswith('"'):
        inner = text[1:-1]
        decoded = codecs.escape_decode(bytes(inner, "utf-8"))[0].decode("utf-8", errors="ignore")
        print(f"codecs.escape_decode success! len: {len(decoded)}")
        with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/App_tsx_step82_codecs.tsx", "w", encoding="utf-8") as out:
            out.write(decoded)
        print("Saved codecs decoded file to scratch/App_tsx_step82_codecs.tsx")
except Exception as e:
    print(f"codecs decode failed: {e}")

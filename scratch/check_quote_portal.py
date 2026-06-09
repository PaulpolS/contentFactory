import os

path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/QuoteVideoPortal.tsx"

try:
    with open(path, "rb") as f:
        content_bytes = f.read()
    
    print("QuoteVideoPortal.tsx size:", len(content_bytes))
    
    # Try different decodings
    decodings = ["utf-8", "windows-1252", "shift-jis", "cp932", "tis-620", "windows-874", "iso-8859-11"]
    for d in decodings:
        try:
            text = content_bytes.decode(d)
            print(f"Decoded successfully with {d}!")
            # Count replacement characters or suspicious patterns
            ufffd_count = text.count('\ufffd')
            # Check if there are Thai characters
            has_thai = any('\u0e00' <= c <= '\u0e7f' for c in text)
            print(f"  Thai present: {has_thai}, U+FFFD count: {ufffd_count}")
            # Print the first 500 chars of KIEAI_VOICES or similar if present
            if "const" in text:
                print("  Snippet of first 200 chars:")
                print(text[:200].strip())
            break
        except Exception as e:
            print(f"Failed with {d}: {e}")
            
except Exception as e:
    print("Error:", e)

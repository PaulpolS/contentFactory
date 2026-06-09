import os

path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/QuoteVideoPortal.tsx"

try:
    with open(path, "rb") as f:
        content_bytes = f.read()
    
    # Decode as iso-8859-11
    text = content_bytes.decode("iso-8859-11")
    
    # Save back as UTF-8
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
        
    print("Successfully converted QuoteVideoPortal.tsx to UTF-8!")
    
except Exception as e:
    print("Error during conversion:", e)

import os

src_dir = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src"
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.css', '.html')):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "rb") as f:
                    content_bytes = f.read()
                content_bytes.decode("utf-8")
            except Exception as e:
                print(f"Error reading {file_path} as UTF-8: {e}")
                # Try to check if it's ISO-8859-11
                try:
                    text = content_bytes.decode("iso-8859-11")
                    print(f"  {file_path} can be decoded as ISO-8859-11. Converting to UTF-8...")
                    with open(file_path, "w", encoding="utf-8") as f_out:
                        f_out.write(text)
                    print(f"  Converted {file_path} to UTF-8 successfully!")
                except Exception as e_tis:
                    print(f"  Could not decode {file_path} as ISO-8859-11 either: {e_tis}")
print("Scan and repair complete!")

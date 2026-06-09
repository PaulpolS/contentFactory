import os

path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx"
if os.path.exists(path):
    print("App.tsx exists")
    size = os.path.getsize(path)
    print(f"Size: {size}")
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    print(f"File text length: {len(content)}")
    print(f"Is 'export default function App' in content? {'export default function App' in content}")
    # Print first 2000 characters
    print("First 2000 chars:")
    print(content[:2000])
else:
    print("App.tsx does not exist")

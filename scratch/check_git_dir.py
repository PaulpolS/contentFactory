import os

path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory"
while True:
    git_path = os.path.join(path, ".git")
    print(f"Checking for .git in {path}: {os.path.exists(git_path)}")
    parent = os.path.dirname(path)
    if parent == path:
        break
    path = parent

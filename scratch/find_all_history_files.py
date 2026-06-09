import os

history_dir = os.path.expanduser("~/Library/Application Support/Code/User/History")
if os.path.exists(history_dir):
    print(f"VS Code history directory exists: {history_dir}")
    files_list = []
    for root, dirs, files in os.walk(history_dir):
        for file in files:
            path = os.path.join(root, file)
            try:
                size = os.path.getsize(path)
                mtime = os.path.getmtime(path)
                files_list.append((path, size, mtime))
            except:
                pass
    print(f"Total files in VS Code history: {len(files_list)}")
    if files_list:
        files_list.sort(key=lambda x: x[2], reverse=True)
        print("Newest 10 files in history:")
        for idx, (path, size, mtime) in enumerate(files_list[:10]):
            import datetime
            dt = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
            print(f"- {path} ({size} bytes, modified {dt})")
else:
    print("VS Code history directory does not exist")

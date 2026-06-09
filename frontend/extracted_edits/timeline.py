import os
from datetime import datetime

folders = [
    "59119761-b490-421b-b15d-46f12f5c4158",
    "19aed406-df08-4966-b539-2983abe8026d",
    "247e75b9-4826-40df-8e90-5fa35311e2ea",
    "eccbdc81-f670-4dae-922b-0be80b80189b",
    "e9655d99-64e7-4443-b6dc-945f61748186"
]

for folder in folders:
    p = f"/Users/paulpolsulintaboon/.gemini/antigravity/brain/{folder}"
    if os.path.exists(p):
        stat = os.stat(p)
        mtime = datetime.fromtimestamp(stat.st_mtime).isoformat()
        print(f"Folder {folder}: mtime={mtime}")
        # check if transcript exists and its size
        tr = f"{p}/.system_generated/logs/transcript.jsonl"
        if os.path.exists(tr):
            tr_size = os.path.getsize(tr)
            print(f"  Transcript size: {tr_size / 1024 / 1024:.2f} MB")
        else:
            print("  Transcript not found")
    else:
        print(f"Folder {folder} does not exist")

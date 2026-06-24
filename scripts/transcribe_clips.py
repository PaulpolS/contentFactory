#!/Library/Frameworks/Python.framework/Versions/3.11/bin/python3
# -*- coding: utf-8 -*-
# ============================================================================
#  transcribe_clips.py — ถอดเสียงคลิปในโฟลเดอร์ด้วย Whisper (รันในเครื่อง)
#  ใช้โดย backend: POST /api/clip-editor/transcribe-rename
#
#  - โหลดโมเดล "ครั้งเดียว" แล้ววนถอดทุกไฟล์ (เร็วกว่าเรียก whisper CLI ทีละไฟล์)
#  - ข้ามคลิปที่ "ไม่มี audio stream" อัตโนมัติ (เช่นคลิป AI-generated)
#  - พ่นผลเป็น JSON ทีละบรรทัด (NDJSON) ทาง stdout ให้ Node อ่านแบบ stream
#
#  Usage: transcribe_clips.py <folder> [model] [language]
#         model    : tiny|base|small|medium|large-v3|large-v3-turbo  (default: large-v3-turbo)
#         language : รหัสภาษา เช่น th, en  หรือ "auto" (default: auto)
# ============================================================================
import sys
import os
import json
import shutil
import subprocess

VIDEO_EXTS = {".mp4", ".mov", ".avi", ".mkv", ".m4v", ".webm"}


def emit(obj):
    """พ่น JSON หนึ่งบรรทัดแล้ว flush ทันที (ให้ Node อ่านแบบ real-time)"""
    sys.stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def find_ffprobe():
    for p in (
        "/opt/homebrew/opt/ffmpeg-full/bin/ffprobe",
        "/opt/homebrew/bin/ffprobe",
        "/usr/local/bin/ffprobe",
    ):
        if os.path.exists(p):
            return p
    return shutil.which("ffprobe") or "ffprobe"


def has_audio(ffprobe, path):
    """True ถ้าไฟล์มี audio stream อย่างน้อย 1 อัน"""
    try:
        out = subprocess.run(
            [ffprobe, "-v", "error", "-select_streams", "a",
             "-show_entries", "stream=index", "-of", "csv=p=0", path],
            capture_output=True, text=True, timeout=30,
        )
        return bool(out.stdout.strip())
    except Exception:
        return False


def main():
    if len(sys.argv) < 2:
        emit({"type": "error", "text": "missing folder argument"})
        return 1

    folder = sys.argv[1]
    model_name = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else "large-v3-turbo"
    language = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else "auto"
    lang = None if language in ("", "auto") else language

    if not os.path.isdir(folder):
        emit({"type": "error", "text": f"folder not found: {folder}"})
        return 1

    files = sorted(
        f for f in os.listdir(folder)
        if os.path.splitext(f)[1].lower() in VIDEO_EXTS
        and os.path.isfile(os.path.join(folder, f))
    )
    if not files:
        emit({"type": "error", "text": "no video files in folder"})
        return 1

    ffprobe = find_ffprobe()
    emit({"type": "log", "text": f"📂 พบ {len(files)} คลิป — กำลังโหลดโมเดล Whisper '{model_name}' (ครั้งแรกอาจช้า)..."})

    try:
        import whisper
    except Exception as e:
        emit({"type": "error", "text": f"import whisper failed: {e}"})
        return 1

    try:
        model = whisper.load_model(model_name)
    except Exception as e:
        emit({"type": "error", "text": f"load model '{model_name}' failed: {e}"})
        return 1

    emit({"type": "log", "text": "✅ โหลดโมเดลเสร็จ — เริ่มถอดเสียง"})

    for idx, name in enumerate(files):
        path = os.path.join(folder, name)
        emit({"type": "progress", "index": idx + 1, "total": len(files), "file": name})

        if not has_audio(ffprobe, path):
            emit({"type": "skip", "file": name, "reason": "no_audio"})
            continue

        try:
            result = model.transcribe(path, language=lang, fp16=False, task="transcribe")
            text = (result.get("text") or "").strip()
            detected = result.get("language") or lang or ""
            emit({"type": "text", "file": name, "text": text, "language": detected})
        except Exception as e:
            emit({"type": "skip", "file": name, "reason": f"transcribe_error: {e}"})

    emit({"type": "all_done"})
    return 0


if __name__ == "__main__":
    sys.exit(main())

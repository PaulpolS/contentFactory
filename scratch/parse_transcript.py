import json

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line_num, line in enumerate(f, 1):
        try:
            data = json.loads(line)
            tool_calls = data.get("tool_calls", [])
            for tc in tool_calls:
                name = tc.get("name", "")
                if "replace_file_content" in name:
                    args = tc.get("args", {})
                    target = args.get("TargetFile", "")
                    if "App.tsx" in target:
                        print(f"Line {line_num}: Tool {name} modified App.tsx. Instruction: {args.get('Instruction', '')}")
                        if "ReplacementContent" in args:
                            print(f"  ReplacementContent snippet: {args['ReplacementContent'][-400:]}")
                        elif "ReplacementChunks" in args:
                            print(f"  Chunks found: {len(args['ReplacementChunks'])}")
                            for idx, chunk in enumerate(args['ReplacementChunks']):
                                print(f"    Chunk {idx} target snippet: {chunk.get('TargetContent', '')[:100]}")
                                print(f"    Chunk {idx} replacement snippet: {chunk.get('ReplacementContent', '')[-400:]}")
        except Exception as e:
            pass

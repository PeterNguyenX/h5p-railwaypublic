#!/usr/bin/env python3
"""
faster-whisper transcription script.
Usage: python3 whisper_transcribe.py <video_or_audio_path> [model_size]
Prints JSON array of {start, end, text} segments to stdout.
"""
import sys
import json
import os

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: whisper_transcribe.py <file_path> [model_size]"}))
        sys.exit(1)

    file_path = sys.argv[1]
    model_size = sys.argv[2] if len(sys.argv) > 2 else "base"

    if not os.path.exists(file_path):
        print(json.dumps({"error": f"File not found: {file_path}"}))
        sys.exit(1)

    try:
        from faster_whisper import WhisperModel

        # Use int8 quantization for CPU — much faster, minimal quality loss
        model = WhisperModel(model_size, device="cpu", compute_type="int8")

        segments_gen, info = model.transcribe(
            file_path,
            beam_size=5,
            language=None,  # auto-detect
            vad_filter=True,  # skip silent parts
            vad_parameters={"min_silence_duration_ms": 500},
        )

        segments = []
        for seg in segments_gen:
            text = seg.text.strip()
            if not text:
                continue
            segments.append({
                "start": round(seg.start, 3),
                "end": round(seg.end, 3),
                "text": text,
            })

        result = {
            "segments": segments,
            "language": info.language,
            "language_probability": round(info.language_probability, 3),
            "duration": round(info.duration, 3),
        }
        print(json.dumps(result))

    except ImportError:
        print(json.dumps({"error": "faster-whisper not installed. Run: pip install faster-whisper"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()

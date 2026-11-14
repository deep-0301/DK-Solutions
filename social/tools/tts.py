#!/usr/bin/env python3
"""Voiceover for explainer reels, using Kokoro TTS (open source, Apache-2.0,
github.com/thewh1teagle/kokoro-onnx).

  pip install kokoro-onnx soundfile
  python tts.py <model_dir> <lines.json> <out_dir> [voice] [speed]

model_dir holds kokoro.onnx and voices.bin from the kokoro-onnx
"model-files-v1.0" release. lines.json is a JSON list of strings. Writes
out_dir/0.wav, 1.wav, ... and prints a JSON list of durations in seconds.
"""
import json
import os
import sys

import soundfile as sf
from kokoro_onnx import Kokoro

model_dir, lines_path, out_dir = sys.argv[1:4]
voice = sys.argv[4] if len(sys.argv) > 4 else "af_heart"
speed = float(sys.argv[5]) if len(sys.argv) > 5 else 1.08

k = Kokoro(os.path.join(model_dir, "kokoro.onnx"), os.path.join(model_dir, "voices.bin"))
durs = []
for i, line in enumerate(json.load(open(lines_path))):
    if not line.strip():
        durs.append(0)
        continue
    samples, sr = k.create(line, voice=voice, speed=speed, lang="en-us")
    sf.write(os.path.join(out_dir, f"{i}.wav"), samples, sr)
    durs.append(round(len(samples) / sr, 3))
print(json.dumps(durs))

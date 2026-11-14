#!/usr/bin/env python3
"""Times a voiced HyperFrames reel to its voiceover and mixes the audio.

  python build-voiced.py <project_dir>

The project holds:
  index.src.html  the composition, with /*SEG*/, /*DUR*/ and /*LINES*/ placeholders
  lines.json      the voice lines, one string each
  vo/0.wav ...    one take per line (tts.py, or Deep's own recordings)
  voice.json      {"start": 0.9, "gap": 0.45, "extra": {"6": 0.5}, "tail": 2.4,
                   "bpm": 96, "mood": "warm",
                   "scrolls": [[line, frac, seconds], ...], "clicks": [[line, frac], ...]}

Lines play one after another with `gap` seconds between them (plus any
`extra` before a line). The script writes index.html with the line times
filled in, assets/music.wav from score.py, and assets/audio.wav: the voice over
the music, with the music ducked under the voice and loudness at -14 LUFS.
"""
import json
import subprocess
import sys
import wave
from pathlib import Path

proj = Path(sys.argv[1])
cfg = json.loads((proj / "voice.json").read_text())
lines = json.loads((proj / "lines.json").read_text())


def dur(p):
    with wave.open(str(p)) as w:
        return w.getnframes() / w.getframerate()


t, seg = cfg.get("start", 0.9), []
for i, _ in enumerate(lines):
    t += cfg.get("extra", {}).get(str(i), 0)
    d = dur(proj / "vo" / f"{i}.wav")
    seg.append([round(t, 3), round(d, 3)])
    t += d + cfg.get("gap", 0.45)
total = round(seg[-1][0] + seg[-1][1] + cfg.get("tail", 2.4), 2)

src = (proj / "index.src.html").read_text()
html = (src.replace("/*SEG*/[]", json.dumps(seg)).replace("/*DUR*/0", str(total))
        .replace("/*DUR*/", str(total)).replace("/*LINES*/[]", json.dumps(lines)))
(proj / "index.html").write_text(html)

at = lambda li, f=0: seg[li][0] + f * seg[li][1]
cues = {"dur": total, "bpm": cfg.get("bpm", 96), "mood": cfg.get("mood", "warm"),
        "scrolls": [[round(at(l, f), 3), round(at(l, f) + s, 3)] for l, f, s in cfg.get("scrolls", [])],
        "clicks": [round(at(l, f), 3) for l, f in cfg.get("clicks", [])]}
(proj / "cues.json").write_text(json.dumps(cues))
(proj / "assets").mkdir(exist_ok=True)
subprocess.run([sys.executable, str(Path(__file__).parent.parent / "tools" / "score.py"),
                str(proj / "assets" / "music.wav"), str(proj / "cues.json")], check=True)

# voice track: each take delayed to its start, then the music ducked under it
args, labels = ["ffmpeg", "-v", "error", "-y", "-i", str(proj / "assets" / "music.wav")], []
for i, (s, _) in enumerate(seg):
    args += ["-i", str(proj / "vo" / f"{i}.wav")]
fc = []
for i, (s, _) in enumerate(seg):
    ms = int(s * 1000)
    fc.append(f"[{i+1}]aresample=44100,aformat=channel_layouts=stereo,adelay={ms}|{ms}[v{i}]")
    labels.append(f"[v{i}]")
fc.append("".join(labels) + f"amix=inputs={len(seg)}:normalize=0,apad,atrim=0:{total},volume=1.25,asplit=2[vox][key]")
fc.append("[0]volume=0.55[mus]")
fc.append("[mus][key]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[duck]")
fc.append("[duck][vox]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=44100[out]")
args += ["-filter_complex", ";".join(fc), "-map", "[out]", "-t", str(total), str(proj / "assets" / "audio.wav")]
subprocess.run(args, check=True)
print(json.dumps({"dur": total, "seg": seg}))

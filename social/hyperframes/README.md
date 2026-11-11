# HyperFrames phone reels

Plays one of our concept sites (`social/concepts/*.html`) live on a real 3D iPhone model, with warm bokeh, falling petals, a camera move timed to the site's scroll, and the `score.py` music. Rendered with [HyperFrames](https://github.com/heygen-com/hyperframes).

```bash
npx hyperframes init wedding-reel --skip-skills --skill=hyperframes
cd wedding-reel && npx hyperframes add vfx-iphone-device   # for assets/iphone.glb (move it from models/)
# assets/: iphone.glb, js/{gsap.min.js,three.min.js,GLTFLoader.js} (gsap@3.14.2, three@0.147.0 from npm),
#          fonts/ (from social/concepts/fonts), music.wav (social/tools/score.py)
python3 ../dk-solutions/social/hyperframes/build-phone-reel.py ../dk-solutions/social/concepts/wedding.html .
npx hyperframes snapshot --at 1,6,12     # stills (the phone screen lags one seek behind in stills only)
npx hyperframes render --quality looks -o out.mp4
```

The phone screen is an HTML-in-canvas subtree, so the site's `vh`/`vw` become container units of a 390x844 screen, drawn at 2x.

## Voiced reels: before/after fix and UI showcase

- `site-fix/`: a made-up bakery site, first cluttered with red X marks on four problems, then wiped to the fixed version with green checks, ending on "Comment FIX". Reel 26, about 58 s.
- `glass-booking/`: a glass booking card on a moving gold ribbon background, tapped through day, time, guests and confirm, then its CSS typed and highlighted line by line, ending on "Comment BOOK". Reel 27, about 48 s.

Each folder has `index.src.html` (plain GSAP, no 3D), `lines.json` (the voiceover, one line each) and `voice.json` (gaps between lines and music cues tied to lines). The animation and the subtitles are timed to the voice takes, so a new recording only needs a rebuild:

1. Put the takes in `<project>/vo/0.wav, 1.wav, ...` (`python ../tools/tts.py <kokoro_dir> lines.json vo af_heart 1.0`, or Deep's own recordings as wav).
2. Put `assets/js/gsap.min.js` and the Manrope and Cormorant fonts in `assets/fonts/`.
3. `python build-voiced.py <project>` writes `index.html`, `assets/music.wav` and `assets/audio.wav` (voice over ducked music, -14 LUFS).
4. `npx hyperframes render --quality looks -o out.mp4`.

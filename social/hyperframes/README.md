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

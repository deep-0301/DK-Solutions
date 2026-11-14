# DK Solutions on Instagram

Reels that bring in small-business clients, posted automatically.

- `reels/` the finished reels (1080x1920 MP4 + cover JPG). They are served at `https://dksolutions.dev/social/reels/...`, which is where Instagram downloads them from.
- `specs/` one JSON file per reel. Edit the text, then rebuild.
- `schedule.json` what posts when, with captions and hashtags. **Nothing posts until its `approved` is `true`.**
- `tools/make-reel.mjs` builds a reel from a spec. `tools/post_reel.py` posts the next approved reel.
- `.github/workflows/instagram.yml` runs the poster Tue, Thu and Sat at 15:30 UTC, and renews the token every Monday.
- `profile/profile-photo.png` the profile picture (the DK logo).
- Facebook Page + YouTube Shorts: the same approved reels are cross-posted. Setup in [CROSSPOST.md](CROSSPOST.md).

All businesses in the reels are made up ("concept example" is in each caption). Don't put a real business, or a lead's mockup, in a public reel without the owner's written OK.

## One-time setup (Deep)

Instagram doesn't let anyone else create the account for you, so these steps are yours. About 20 minutes.

### 1. Create the Instagram account
1. In the Instagram app, sign up with **contact@dksolutions.dev** (not your personal email or phone).
2. Username: try `dksolutions.dev`, then `dksolutions.web` or `dk.solutions.web`.
3. Name: `DK Solutions | Websites`. Profile photo: `profile/profile-photo.png`.
4. Bio (no prices, no personal info):
   > Websites that bring small businesses more customers ⚡
   > New sites · Redesigns · AI add-ons
   > 👇 Free quote
5. Link: `https://dksolutions.dev`

### 2. Make it a Business account
Profile → ☰ → **Settings and activity → Account type and tools → Switch to professional account → Business**.
Category: **Web designer** (or "Website"). Contact options: email `contact@dksolutions.dev` only. Skip the address and phone, and turn **off** "Display contact info" for anything personal.
Linking a Facebook page is optional; the posting setup below doesn't need one.

### 3. Get an API token (lets the robot post)
1. Go to <https://developers.facebook.com/apps>, log in, **Create app**.
2. Use case: **Manage messaging & content on Instagram**. App name: `DK Solutions Poster`. Business portfolio: skip / none.
3. In the app: **Instagram → API setup with Instagram login**.
4. Under **Generate access tokens**, click **Add account** and log in as the new DK Solutions Instagram account. Allow the permissions (it needs *content publish*).
   - If it says the account isn't a tester: **App roles → Roles → Add people → Instagram tester**, add the username, then in Instagram accept it under **Settings → Website permissions → Apps and websites → Tester invites**.
5. Click **Generate token** next to the account and copy it. It's valid 60 days; the Monday job renews it if you add `GH_PAT` below.
6. The app can stay in Development mode. It only posts to your own account.

### 4. Give the token to GitHub
Repo **Settings → Secrets and variables → Actions → New repository secret**:
- `IG_ACCESS_TOKEN` = the token from step 3.
- `GH_PAT` (recommended) = a fine-grained token from <https://github.com/settings/personal-access-tokens/new> with access to only this repo and **Secrets: Read and write**. Without it the token stops working after 60 days and you'd have to repeat step 3.5.

### 5. Test, then approve
- **Actions → Post Instagram reel → Run workflow** with *Dry run* ticked. It shows what would post.
- Tell Claude which reels are OK (or set `"approved": true` in `schedule.json`). The workflow posts the next approved one on the next Tue/Thu/Sat.

## Explainer reels (voiceover + captions)
The current schedule uses narrated explainers (`specs/10-13`), built with `tools/make-explainer.mjs`. The voice is Kokoro TTS (open source, github.com/thewh1teagle/kokoro-onnx).
```bash
pip install kokoro-onnx soundfile
# download kokoro-v1.0.int8.onnx (save as kokoro.onnx) and voices-v1.0.bin from the kokoro-onnx "model-files-v1.0" release into one folder
KOKORO_DIR=/path/to/that/folder node social/tools/make-explainer.mjs social/specs/12-chatbot-explained.json
```
Scene types: `title`, `point` (n, title, body), `stat` (value, label), `compare` (left/right: h, v, items), `timeline` (items: d, t, say), `chat` (messages: from user/bot, text, say), `end`. Every scene or item has `say` (spoken) and optional `cap` (on-screen caption, `*word*` highlights yellow).

## Website-on-a-laptop concept reels

Reels 20+ show a made-up business's website playing on a 3D laptop on a desk, shot like a film: depth of field, window light, string-light bokeh and a slow handheld camera move. No words: an original music bed (`social/tools/score.py`, numpy) is generated from the site's own `SCROLL` and `CLICK` timings, so the drums drop on the first scroll, each scroll gets a whoosh and a rising arpeggio, and a click gets a chime. Keep scroll moves on the bar grid (96 BPM = 2.5 s per bar).

- `social/concepts/*.html`: the concept sites (1440x900). Each one exposes `window.update(t)` that sets scroll, cursor and animation for time `t`, so every frame is exact.
- `social/tools/laptop-scene.html`: the three.js desk scene that puts each site frame on the laptop screen.
- `social/specs/2x-*.json`: `{ id, site, dur, bpm, mood: "warm" | "dark", tag }` (optional `hook` text and `say` voice lines still work).

```bash
npm i three@0.170.0   # anywhere; point THREE_DIR at node_modules/three
THREE_DIR=... KOKORO_DIR=... PYTHON=... node social/tools/make-showcase.mjs social/specs/20-cafe-concept.json
PREVIEW=out.png node social/tools/make-showcase.mjs social/specs/20-cafe-concept.json   # 4 stills only
```

Use made-up businesses only, and say "concept example" in the caption.

## Making more reels
```bash
node social/tools/make-reel.mjs social/specs/07-my-new-reel.json   # needs Node, Playwright, ffmpeg
```
Scene types: `text` (kicker, title, sub), `list` (title, items; reveals one at a time), `phone` (site `before`/`after`, tone `bad`/`good`, notes), `cta`. Wrap words in `*stars*` for the gradient highlight. Add an entry to `schedule.json` with `approved: false`.

Instagram's API can't add trending music. Each reel has a soft generated music bed; for extra reach you can add trending audio when re-sharing it to your story.

## Content plan

**Goal:** a small-business owner sees a reel, thinks "that's my website", taps the link in bio, and asks for a quote.

**Three pillars, rotated:**
1. **Before/after makeovers** (main driver). Outdated site → modern phone-first site, with the problems and fixes called out.
2. **Quick tips owners can check today** (saves and shares). 3 signs, 5-second test, no-website costs, Google profile, mobile check.
3. **Proof and process** (once there are clients). Real launches with permission, "how a site gets built in 7 days", client quotes.

**Rhythm:** 3 reels a week (Tue/Thu/Sat), 12 to 16 seconds, hook in the first 2 seconds, one CTA at the end ("free quote, link in bio"). Never prices.

**Next ideas:** dentist, landscaper/snow removal, café, salon, cleaning company, tutoring centre makeovers; "Does your site show up on Google Maps?"; "Your Instagram isn't a website"; "What to put above the fold"; "Why your contact form isn't working"; "AI chat on your website, what it actually does".

**Weekly 10 minutes for Deep:** reply to comments and DMs, follow and comment on 10 local small businesses, share each new reel to your story.

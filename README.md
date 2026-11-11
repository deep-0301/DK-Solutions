# DK Solutions

Website for DK Solutions, Deep Patel's Ottawa-based studio that builds new websites and redesigns for small businesses anywhere, with optional AI features.

Live at **https://dksolutions.dev/**

Plain HTML, CSS and JavaScript with no build step. GitHub Pages serves it straight from the `main` branch.

| Path | What it is |
| --- | --- |
| `index.html` | The whole one-page site: services, work, process, packages, about, FAQ, contact |
| `assets/css/style.css` | Styles. Colours and gradients are the variables at the top. |
| `assets/js/main.js` | Menu, scroll-driven 3D (CSS variables), pointer tilt, pause-motion button, mobile dock, demo AI assistant, contact form |
| `assets/js/hero3d.js` | The three.js hero: an "exploded" website whose glass layers click together as you scroll. Loaded after first paint, only on capable devices. |
| `assets/vendor/three/` | three.js r185 (MIT), self-hosted so the site needs no CDN |
| `assets/img/` | Favicon, social preview image, project screenshots |
| `404.html` | Page not found |

## Common edits

- **Packages:** the `#packages` section in `index.html`. No prices are shown on purpose; each package asks for a quote.
- **Projects:** each project is an `<article class="work">` in `#work`. Screenshots are 960×600 WebP files in `assets/img/`.
- **Demo AI assistant:** the "Ask a question" chat is a scripted demo. Its answers are the `KB` list in `assets/js/main.js` (keywords and reply). It runs entirely in the browser with no API key.
- **Contact form:** sends through EmailJS using the IDs at the top of `assets/js/main.js`. The template receives `user_name`, `user_email` and `message` (business, website, need and details combined). If sending fails, the visitor gets a mailto link instead.
- **Custom domain:** add a `CNAME` file with the domain, then update the URLs in `index.html` (canonical, Open Graph, JSON-LD), `robots.txt` and `sitemap.xml`.

## How the 3D works

- **Hero:** `hero3d.js` draws six layers of a website (browser, nav, headline, photo, cards, AI chat) with Canvas 2D textures, so there are no image downloads. Scroll moves them from exploded to assembled; the mouse tilts the scene. A CSS 3D copy of the same stack (`.stack` in `index.html`) shows first and stays in place when WebGL is off, data saver is on, the device is low-end, or the visitor prefers reduced motion.
- **Sections:** anything with `data-depth` rises in from a tilted 3D angle as it scrolls into view. `.tilt` elements lean toward the mouse (desktop only).
- **Pause button:** the pause icon in the header stops all motion and remembers the choice. Reduced-motion users get a still page automatically.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

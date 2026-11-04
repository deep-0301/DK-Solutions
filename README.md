# DK Solutions

Website for DK Solutions, Deep Patel's Ottawa studio that builds new websites and redesigns for Canadian small businesses, with optional AI features.

Live at **https://dksolutions.ca/**

Plain HTML, CSS and JavaScript with no build step. GitHub Pages serves it straight from the `main` branch.

| Path | What it is |
| --- | --- |
| `index.html` | The whole one-page site: services, work, process, packages, about, FAQ, contact |
| `assets/css/style.css` | Styles. Colours and gradients are the variables at the top. |
| `assets/js/main.js` | Menu, scroll reveals, the demo AI assistant, contact form |
| `assets/img/` | Favicon, social preview image, project screenshots |
| `404.html` | Page not found |

## Common edits

- **Packages:** the `#packages` section in `index.html`. No prices are shown on purpose; each package asks for a quote.
- **Projects:** each project is an `<article class="work">` in `#work`. Screenshots are 960×600 WebP files in `assets/img/`.
- **Demo AI assistant:** the "Ask a question" chat is a scripted demo. Its answers are the `KB` list in `assets/js/main.js` (keywords and reply). It runs entirely in the browser with no API key.
- **Contact form:** sends through EmailJS using the IDs at the top of `assets/js/main.js`. The template receives `user_name`, `user_email` and `message` (business, website, need and details combined). If sending fails, the visitor gets a mailto link instead.
- **Custom domain:** add a `CNAME` file with the domain, then update the URLs in `index.html` (canonical, Open Graph, JSON-LD), `robots.txt` and `sitemap.xml`.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

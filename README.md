# Deep Patel Web

Portfolio and services site for Deep Patel, a web developer in Ottawa building websites for Canadian small businesses.

Live at **https://deep-0301.github.io/**

Plain HTML, CSS and JavaScript with no build step. GitHub Pages serves it straight from the `main` branch.

| Path | What it is |
| --- | --- |
| `index.html` | The whole one-page site: services, work, process, pricing, about, FAQ, contact |
| `assets/css/style.css` | Styles. Colours are the variables at the top (light and dark). |
| `assets/js/main.js` | Menu, theme toggle, scroll reveals, contact form |
| `assets/img/` | Favicon, social preview image, project screenshots |
| `404.html` | Page not found |

## Common edits

- **Prices and packages:** the `#pricing` section in `index.html`.
- **Projects:** each project is an `<article class="work">` in `#work`. Screenshots are 960×600 WebP files in `assets/img/`.
- **Contact form:** sends through EmailJS using the IDs at the top of `assets/js/main.js`. The template receives `user_name`, `user_email` and `message` (business, website, need and details combined). If sending fails, the visitor gets a mailto link instead.
- **Custom domain:** add a `CNAME` file with the domain, then update the URLs in `index.html` (canonical, Open Graph, JSON-LD), `robots.txt` and `sitemap.xml`.

## Preview locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

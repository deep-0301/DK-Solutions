#!/usr/bin/env python3
"""Builds a HyperFrames composition (index.html) that plays one of our concept
sites live on a real 3D iPhone model, with bokeh, falling petals and a camera
move timed to the site's scroll.

  python build-phone-reel.py <concept.html> <project_dir> [theme.json]

The concept site is inlined into the phone's screen (an HTML-in-canvas
subtree, captured to a WebGL texture every frame), so the site must expose
window.update(t) and use vh/vw units, which are rewritten to container units
of the 390x844 phone screen.
"""
import re
import sys
from pathlib import Path

src, out = Path(sys.argv[1]), Path(sys.argv[2])
theme = Path(sys.argv[3]).read_text() if len(sys.argv) > 3 else None  # optional theme JSON
html = src.read_text()
css = re.search(r"<style>(.*?)</style>", html, re.S).group(1)
body = re.search(r"<body>(.*?)<script>", html, re.S).group(1)
js = re.search(r"<script>(.*?)</script>\s*</body>", html, re.S).group(1)

# CSS: viewport units -> phone-screen container units; scope page rules.
css = re.sub(r"(\d)vh", r"\1cqh", css)
css = re.sub(r"(\d)vw", r"\1cqw", css)
css = css.replace("url(fonts/", "url(assets/fonts/")
css = re.sub(r"html,body\{[^}]*\}", "", css)
css = css.replace("*{box-sizing:border-box;margin:0}", "#phone-html *{box-sizing:border-box;margin:0}")
css = css.replace("body{font-family", "#phone-html{font-family")
css = css.replace("#vp{position:fixed;", "#vp{position:absolute;")
# JS: no autoplay loop, fixed screen height, container units in transforms.
js = js.split("// On a real phone")[0]
js = js.replace("const vh = () => window.innerHeight;", "const vh = () => 844;")
js = js.replace("vw,${", "cqw,${").replace("}vh)", "}cqh)")
js = js.replace("update(0);", "")

TEMPLATE = Path(__file__).with_name("phone-reel.template.html").read_text()
if theme:
    import json as _j
    th = _j.loads(theme)
    TEMPLATE = TEMPLATE.replace("/*THEME*/{", "/*THEME*/" + _j.dumps(th) + " || {").replace("/*BGCSS*/#120407", th.get("bgcss", "#120407"))
page = TEMPLATE.replace("/*SITE_CSS*/", css).replace("<!--SITE_HTML-->", body).replace("/*SITE_JS*/", js)
(out / "index.html").write_text(page)
print(out / "index.html")

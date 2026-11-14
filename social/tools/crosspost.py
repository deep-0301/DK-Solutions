#!/usr/bin/env python3
"""Cross-post approved reels from social/schedule.json to Facebook and YouTube.

Same rule as Instagram: only entries with "approved": true whose post_after has
passed are posted, one per run per platform. An entry can opt out of a platform
with "platforms": ["instagram"] (default: every platform).

What was posted is recorded in social/state/<platform>.json, so this never
touches schedule.json (which the Instagram job writes).

Usage:
  crosspost.py facebook [post|whoami]
  crosspost.py youtube  [post|whoami]

Env (Facebook): FB_PAGE_ID, FB_PAGE_TOKEN (a Page access token with
  pages_manage_posts, pages_read_engagement, publish_video).
Env (YouTube): YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN (scope
  youtube.upload), optional YT_PRIVACY (public | unlisted | private, default public).
Common: SITE_URL (default https://dksolutions.dev), DRY_RUN=1 prints and posts nothing.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # social/
REPO = os.path.dirname(ROOT)
SCHEDULE = os.path.join(ROOT, "schedule.json")
STATE_DIR = os.path.join(ROOT, "state")
FB_API = "https://graph.facebook.com/v23.0"


# ---------- shared ----------

def http(method, url, params=None, data=None, headers=None, raw=False):
    headers = dict(headers or {})
    if params:
        url = f"{url}{'&' if '?' in url else '?'}{urllib.parse.urlencode(params)}"
    if isinstance(data, dict):
        data = urllib.parse.urlencode(data).encode()
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            return r if raw else json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"API error {e.code} on {url.split('?')[0]}: {e.read().decode(errors='replace')}")


def env(name):
    v = os.environ.get(name)
    if not v:
        sys.exit(f"{name} is not set")
    return v


def load_state(platform):
    path = os.path.join(STATE_DIR, f"{platform}.json")
    if os.path.exists(path):
        with open(path) as f:
            return path, json.load(f)
    return path, {"posted": {}}


def save_state(path, state):
    os.makedirs(STATE_DIR, exist_ok=True)
    with open(path, "w") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)
        f.write("\n")


def next_due(platform, state):
    with open(SCHEDULE) as f:
        sched = json.load(f)
    now = datetime.now(timezone.utc)
    due = [i for i in sched["posts"]
           if i.get("approved")
           and platform in i.get("platforms", ["instagram", "facebook", "youtube"])
           and i["id"] not in state["posted"]
           and datetime.fromisoformat(i["post_after"].replace("Z", "+00:00")) <= now]
    return sorted(due, key=lambda i: i["post_after"])[0] if due else None


def full_caption(item):
    tags = " ".join(item.get("hashtags", []))
    return f"{item['caption'].strip()}\n\n{tags}".strip()


def reel_url(item):
    base = os.environ.get("SITE_URL", "https://dksolutions.dev").rstrip("/")
    return f"{base}/social/reels/{item['id']}.mp4"


# ---------- Facebook Page reels ----------

def fb_whoami():
    page = env("FB_PAGE_ID")
    print(json.dumps(http("GET", f"{FB_API}/{page}", {"fields": "id,name,link", "access_token": env("FB_PAGE_TOKEN")}), indent=2))


def fb_post(item):
    page, tok = env("FB_PAGE_ID"), env("FB_PAGE_TOKEN")
    start = http("POST", f"{FB_API}/{page}/video_reels", data={"upload_phase": "start", "access_token": tok})
    vid = start["video_id"]
    # Facebook pulls the file from our site (same URL Instagram uses).
    up = http("POST", start.get("upload_url") or f"https://rupload.facebook.com/video-upload/v23.0/{vid}",
              headers={"Authorization": f"OAuth {tok}", "file_url": reel_url(item)})
    if not up.get("success"):
        sys.exit(f"Facebook upload failed: {up}")
    http("POST", f"{FB_API}/{page}/video_reels", data={
        "upload_phase": "finish", "video_id": vid, "video_state": "PUBLISHED",
        "description": full_caption(item), "access_token": tok})
    for _ in range(60):  # up to ~10 minutes
        st = http("GET", f"{FB_API}/{vid}", {"fields": "status,permalink_url", "access_token": tok})
        s = st.get("status", {})
        print("status:", s.get("video_status"), s.get("publishing_phase", {}).get("status"))
        if s.get("video_status") == "error":
            sys.exit(f"Facebook could not process the video: {st}")
        if s.get("publishing_phase", {}).get("status") == "complete":
            break
        time.sleep(10)
    link = st.get("permalink_url", "")
    return {"video_id": vid, "permalink": f"https://www.facebook.com{link}" if link.startswith("/") else link}


# ---------- YouTube Shorts ----------

def yt_access_token():
    r = http("POST", "https://oauth2.googleapis.com/token", data={
        "client_id": env("YT_CLIENT_ID"), "client_secret": env("YT_CLIENT_SECRET"),
        "refresh_token": env("YT_REFRESH_TOKEN"), "grant_type": "refresh_token"})
    return r["access_token"]


def yt_whoami():
    r = http("GET", "https://www.googleapis.com/youtube/v3/channels", {"part": "snippet", "mine": "true"},
             headers={"Authorization": f"Bearer {yt_access_token()}"})
    print(json.dumps([{"id": c["id"], "title": c["snippet"]["title"]} for c in r.get("items", [])], indent=2))


def yt_title(item):
    if item.get("youtube_title"):
        t = item["youtube_title"]
    else:
        t = item["caption"].strip().split("\n")[0]
    t = t.replace("<", "").replace(">", "")
    if "#shorts" not in t.lower():
        t = t[:91].rstrip() + " #Shorts"
    return t[:100]


def yt_post(item):
    tok = yt_access_token()
    desc = (full_caption(item) + "\n\nMore: https://dksolutions.dev").replace("<", "").replace(">", "")
    meta = {
        "snippet": {"title": yt_title(item), "description": desc[:5000],
                    "tags": [h.lstrip("#") for h in item.get("hashtags", [])] + ["shorts"],
                    "categoryId": "27"},  # Education
        "status": {"privacyStatus": os.environ.get("YT_PRIVACY", "public"),
                   "selfDeclaredMadeForKids": False},
    }
    path = os.path.join(REPO, item["video"])
    size = os.path.getsize(path)
    r = http("POST", "https://www.googleapis.com/upload/youtube/v3/videos",
             {"uploadType": "resumable", "part": "snippet,status"},
             data=json.dumps(meta).encode(), raw=True,
             headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json; charset=UTF-8",
                      "X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": str(size)})
    session = r.headers["Location"]
    with open(path, "rb") as f:
        v = http("PUT", session, data=f.read(), headers={"Content-Type": "video/mp4", "Content-Length": str(size)})
    status = v.get("status", {})
    if status.get("privacyStatus") != meta["status"]["privacyStatus"]:
        print("::warning::YouTube set this Short to", status.get("privacyStatus"),
              "- uploads from an API project that hasn't passed YouTube's audit stay private. See social/README.md.")
    return {"video_id": v["id"], "permalink": f"https://youtube.com/shorts/{v['id']}",
            "privacy": status.get("privacyStatus")}


# ---------- main ----------

PLATFORMS = {
    "facebook": {"post": fb_post, "whoami": fb_whoami, "secret": "FB_PAGE_TOKEN"},
    "youtube": {"post": yt_post, "whoami": yt_whoami, "secret": "YT_REFRESH_TOKEN"},
}


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in PLATFORMS:
        sys.exit(__doc__)
    platform, cmd = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else "post")
    p = PLATFORMS[platform]
    if cmd == "whoami":
        return p["whoami"]()
    path, state = load_state(platform)
    item = next_due(platform, state)
    if not item:
        print(f"{platform}: nothing approved and due. Done.")
        return
    print(f"{platform}: posting {item['id']}")
    if os.environ.get("DRY_RUN") == "1":
        if platform == "youtube":
            print("DRY_RUN title:", yt_title(item))
        print("DRY_RUN caption:\n" + full_caption(item))
        return
    if not os.environ.get(p["secret"]):
        print(f"::warning::{p['secret']} is not set, so {platform} posting is off. See social/README.md.")
        return
    result = p["post"](item)
    result["posted_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    state["posted"][item["id"]] = result
    save_state(path, state)
    print(f"Posted: {result.get('permalink')}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Post the next due, approved reel in social/schedule.json to Instagram.

Uses the Instagram API with Instagram Login (graph.instagram.com), which works
for a Business or Creator account without a Facebook page.

Env:
  IG_ACCESS_TOKEN  long-lived Instagram user token (required)
  IG_USER_ID       optional; looked up from the token if missing
  SITE_URL         base URL the reels are served from (default https://dksolutions.dev)
  DRY_RUN=1        print what would be posted, post nothing

Only entries with "approved": true and post_after <= now are posted, one per run.
Commands:
  post_reel.py            post the next due reel
  post_reel.py refresh    print a refreshed 60-day token (for the secret)
  post_reel.py whoami     check the token and show the account
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

API = "https://graph.instagram.com/v23.0"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCHEDULE = os.path.join(ROOT, "schedule.json")


def call(method, path, **params):
    url = path if path.startswith("http") else f"{API}/{path}"
    data = urllib.parse.urlencode(params).encode()
    if method == "GET":
        url, data = f"{url}?{data.decode()}", None
    req = urllib.request.Request(url, data=data, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        sys.exit(f"Instagram API error {e.code} on {path}: {body}")


def token():
    t = os.environ.get("IG_ACCESS_TOKEN")
    if not t:
        sys.exit("IG_ACCESS_TOKEN is not set")
    return t


def whoami():
    me = call("GET", "me", fields="user_id,username,account_type", access_token=token())
    print(json.dumps(me, indent=2))
    return me


def caption_for(item):
    tags = " ".join(item.get("hashtags", []))
    return f"{item['caption'].strip()}\n\n{tags}".strip()


def post_next():
    with open(SCHEDULE) as f:
        sched = json.load(f)
    now = datetime.now(timezone.utc)
    due = [i for i in sched["posts"]
           if i.get("approved") and not i.get("posted_at")
           and datetime.fromisoformat(i["post_after"].replace("Z", "+00:00")) <= now]
    if not due:
        print("Nothing approved and due. Done.")
        return False
    item = sorted(due, key=lambda i: i["post_after"])[0]
    base = os.environ.get("SITE_URL", "https://dksolutions.dev").rstrip("/")
    video_url = f"{base}/{item.get('video') or f'social/reels/{item['id']}.mp4'}"
    cover_url = f"{base}/social/reels/{item['id']}.jpg"
    print(f"Posting {item['id']} from {video_url}")
    if os.environ.get("DRY_RUN") == "1":
        print("DRY_RUN caption:\n" + caption_for(item))
        return False

    tok = token()
    uid = os.environ.get("IG_USER_ID") or call("GET", "me", fields="user_id", access_token=tok)["user_id"]
    c = call("POST", f"{uid}/media", media_type="REELS", video_url=video_url, cover_url=cover_url,
             caption=caption_for(item), share_to_feed="true", access_token=tok)
    cid = c["id"]
    for _ in range(60):  # up to ~10 minutes for Instagram to process the video
        st = call("GET", cid, fields="status_code,status", access_token=tok)
        code = st.get("status_code")
        print("container status:", code)
        if code == "FINISHED":
            break
        if code in ("ERROR", "EXPIRED"):
            sys.exit(f"Instagram could not process the video: {st}")
        time.sleep(10)
    else:
        sys.exit("Timed out waiting for Instagram to process the video")
    pub = call("POST", f"{uid}/media_publish", creation_id=cid, access_token=tok)
    link = call("GET", pub["id"], fields="permalink", access_token=tok).get("permalink")
    item["posted_at"] = now.isoformat(timespec="seconds")
    item["media_id"] = pub["id"]
    item["permalink"] = link
    with open(SCHEDULE, "w") as f:
        json.dump(sched, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"Posted: {link}")
    return True


def refresh():
    r = call("GET", "https://graph.instagram.com/refresh_access_token",
             grant_type="ig_refresh_token", access_token=token())
    print(r["access_token"])


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "post"
    {"post": post_next, "refresh": refresh, "whoami": whoami}[cmd]()

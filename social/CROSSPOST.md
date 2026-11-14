# Facebook and YouTube cross-posting

The same reels in `schedule.json` also go to the **DK Solutions Facebook Page** (as Reels) and the **DK Solutions YouTube channel** (as Shorts). One approval covers all three: when a reel has `"approved": true`, Instagram posts it at 15:30 UTC and `.github/workflows/crosspost.yml` posts it to Facebook and YouTube at 16:30 UTC on the same day. To skip a platform for one reel, add `"platforms": ["instagram", "facebook"]` (leave out the one to skip). Optional `"youtube_title"` overrides the Shorts title (otherwise it's the caption's first line plus `#Shorts`).

What has been posted is kept in `state/facebook.json` and `state/youtube.json`. Until a platform's secrets are set, its job just prints a warning and posts nothing.

Test any time: **Actions → Cross-post reels to Facebook and YouTube → Run workflow** with *Dry run* ticked.

## Facebook Page (one time, about 10 minutes)

1. Log in to facebook.com. Go to <https://www.facebook.com/pages/create>.
   - Name: `DK Solutions`. Category: `Website designer`.
   - Bio: `Websites that bring small businesses more customers. New sites, redesigns, AI add-ons. Free quote at dksolutions.dev`
   - Website `https://dksolutions.dev`, email `contact@dksolutions.dev`. No phone, no address.
   - Profile picture: `profile/profile-photo.png`.
   Your personal profile is only the Page's admin; visitors see "DK Solutions".
2. Link Instagram: Page → **Settings → Linked accounts → Instagram → Connect** and log in as @dksolutions.dev.
3. Page token. In the Meta app made for Instagram (`DK Solutions Poster`, developers.facebook.com/apps):
   1. **Use cases → Add use case → Manage everything on your Page.**
   2. Open <https://developers.facebook.com/tools/explorer/>, pick the app, then **User or Page → Get Page Access Token**. Add the permissions `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `publish_video` and allow them for the DK Solutions Page.
   3. Click the ⓘ next to the token → **Open in Access Token Tool → Extend Access Token**. Copy the long-lived token.
   4. Back in the Explorer, paste that token and run `GET me/accounts`. The DK Solutions row has the Page `id` and an `access_token` that doesn't expire.
4. GitHub repo **Settings → Secrets and variables → Actions**: add `FB_PAGE_ID` and `FB_PAGE_TOKEN`.

## YouTube channel (one time, about 15 minutes)

1. Sign in to youtube.com with your own Google account. **Profile picture → Settings → Add or manage your channel(s) → Create a channel.** Name it `DK Solutions`. This makes a separate brand channel, so your personal name isn't shown.
   - Handle: `@dksolutionsdev` (or `@dksolutions.web`). Picture: `profile/profile-photo.png`.
   - In YouTube Studio → **Customization → Basic info**: same bio as Facebook, link `https://dksolutions.dev`, contact email `contact@dksolutions.dev`.
2. API access at <https://console.cloud.google.com>:
   1. New project `DK Solutions Poster`. **APIs & Services → Library → YouTube Data API v3 → Enable.**
   2. **OAuth consent screen** (Google Auth Platform): External, app name `DK Solutions Poster`, your email as support/developer contact. Then **Audience → Publish app** (In production). In "Testing" the token stops working after 7 days.
   3. **Clients → Create client → Web application.** Authorized redirect URI: `https://developers.google.com/oauthplayground`. Copy the client ID and secret.
3. Refresh token at <https://developers.google.com/oauthplayground>:
   1. ⚙ (top right) → **Use your own OAuth credentials**, paste the ID and secret.
   2. In "Input your own scopes" enter `https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly` → **Authorize APIs**. Choose the **DK Solutions** channel (not your personal one). Google warns the app is unverified: Advanced → continue (it's your own app).
   3. **Exchange authorization code for tokens.** Copy the refresh token.
4. GitHub secrets: `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REFRESH_TOKEN`.
5. **Public uploads need YouTube's free API audit.** Until a new API project passes it, YouTube keeps API uploads private. Apply at <https://support.google.com/youtube/contact/yt_api_form> (say it uploads your own Shorts to your own channel). Until it's approved, open each new Short in YouTube Studio and switch it to Public, which takes one click.

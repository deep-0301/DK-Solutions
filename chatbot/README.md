# Website AI assistant

The chat on dksolutions.dev. Visitors ask in their own words and get real AI answers about DK Solutions. When someone wants a quote, the assistant collects their name, email and needs, and the lead (with the chat transcript) is emailed to contact@dksolutions.dev automatically through the site's EmailJS account. No one has to watch the chat.

| Piece | Where |
| --- | --- |
| Chat panel, streaming, lead email | `assets/js/main.js` (AI assistant section). `CHAT_ENDPOINT` is the Worker URL. |
| AI backend | `chatbot/worker.js`, a Cloudflare Worker using Workers AI (Llama 3.3 70B, free daily allowance, no API key). |
| What it knows | The `KNOWLEDGE` text at the top of `worker.js`. Edit it to change answers. |
| Allowed sites, model, rate limit | `chatbot/wrangler.toml` |

If the Worker can't be reached, the chat quietly falls back to the built-in keyword answers, so the site never shows a broken chat.

## Deploy

Either:

- `cd chatbot && npx wrangler deploy` (after `npx wrangler login`), or
- Cloudflare dashboard > Workers > Create > name it `dk-solutions-chat`, paste `worker.js`, then Settings > Bindings > add Workers AI with the name `AI`, or
- automatic: add the repo secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, and `.github/workflows/chat-worker.yml` redeploys on every change to `chatbot/` on main.

Rules baked into the prompt: no prices (free fixed quote instead), no personal details about Deep, websites first with AI as an add-on, businesses anywhere in the world.

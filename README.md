# Social Preview Inspector

Extract Open Graph and Twitter Card meta tags from a page and compare how Twitter, Open Graph, and Google previews would render.

## API

### `GET /inspect?url=`

| Query | Required | Description                |
| ----- | -------- | -------------------------- |
| `url` | Yes      | Target URL (http or https) |

Returns extracted tags plus side-by-side preview validation with missing fields flagged per platform.

## Run locally

```bash
cd apps/experiments/social-preview-inspector
npm install
npm run dev
```

## Deploy

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/shrinathsnayak/cloudflare-experiments/tree/main/apps/experiments/social-preview-inspector)

## Cloudflare features used

- Workers
- Fetch API
- HTMLRewriter

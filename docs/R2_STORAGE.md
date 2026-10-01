# Cloudflare R2 for blog media

R2 holds your **global blog OG image** now; the same bucket can store per-article covers later.

## 1. Cloudflare dashboard

1. **R2 → Create bucket** (e.g. `silentcpo-media`).
2. **Public access** (pick one):
   - **R2.dev subdomain** — bucket → Settings → Public access → Allow; copy the `https://pub-….r2.dev` base URL, **or**
   - **Custom domain** (recommended long-term) — e.g. `media.silentcpo.me` → CNAME to R2; use `https://media.silentcpo.me/...` as public base.
3. **Upload** your file, e.g. key `blog/og-default.webp`.
4. **API token** — R2 → Manage R2 API Tokens → Create token with **Object Read & Write** on this bucket. Save:
   - Access Key ID  
   - Secret Access Key  
5. Note your **Account ID** (R2 overview or URL).

## 2. Environment variables (Vercel + local `.env`)

Required for the live site to show the image:

| Variable | Example | Purpose |
|----------|---------|---------|
| `BLOG_OG_IMAGE_URL` | `https://pub-xxxx.r2.dev/blog/og-default.webp` | Full HTTPS URL of the global blog/social image |

Optional (for the upload script or future admin uploads):

| Variable | Example |
|----------|---------|
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | From R2 API token |
| `R2_SECRET_ACCESS_KEY` | From R2 API token |
| `R2_BUCKET_NAME` | `silentcpo-media` |
| `R2_PUBLIC_BASE_URL` | `https://pub-xxxx.r2.dev` or `https://media.silentcpo.me` |

Never commit secrets. Do not use `NEXT_PUBLIC_` for R2 credentials.

## 3. Upload from your Mac (optional)

With the optional R2 variables in `.env`:

```bash
npm install   # installs @aws-sdk/client-s3 if added
node scripts/upload-r2.mjs ./path/to/blog-og-default.webp blog/og-default.webp
```

Then set:

```bash
BLOG_OG_IMAGE_URL="${R2_PUBLIC_BASE_URL}/blog/og-default.webp"
```

on Vercel and redeploy.

## 4. What the site does today

- **`BLOG_OG_IMAGE_URL`** drives Open Graph / Twitter images on `/blog` and every `/blog/[slug]` page.
- Blog listing and homepage teaser can show the same image as a card header when the URL is set.
- If unset, the site falls back to `/images/brand-card.png` on your domain (add that file under `public/images/` or rely on R2).

## 5. Security notes

- Public bucket objects are world-readable — only put **marketing-safe** assets there.
- Keep API keys server-side only; rotate if leaked.

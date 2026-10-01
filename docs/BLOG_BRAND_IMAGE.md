# Global blog / social image (ChatGPT)

Use this once to create a **single branded hero** for all blog posts and social previews until you add per-article art.

## Specs

| Use | Size | Aspect |
|-----|------|--------|
| Open Graph / X / LinkedIn | **1200 × 630 px** | ~1.91:1 |
| Optional sharper master | **2400 × 1260 px** | Same ratio, downscale for web |

Export as **WebP** or **PNG** (WebP preferred for R2). File name suggestion: `blog-og-default.webp`.

## Copy-paste prompt (ChatGPT — DALL·E / image generation)

```
Create a wide social preview image for a UK digital product studio called SilentCPO. No people, no faces, no logos, no readable text, no watermarks.

Mood: quiet confidence, premium, technical but human. Think “complex ideas, quietly mastered.”

Visual direction:
- Deep navy-teal background (#081F2C) with subtle depth (soft gradient or very faint grid, not busy).
- Warm gold accent (#B89A62): thin lines, soft glow, or abstract geometric shapes suggesting connection, structure, or a product blueprint — not literal UI screenshots.
- Optional muted sage green highlight (#6F9C8C) at very low opacity for balance.
- Minimal composition with generous negative space on the left or centre (safe area for future title overlay if needed).
- Style: modern, editorial, slightly cinematic; avoid stock-photo clichés, robots, brain icons, or “AI” imagery.

Aspect ratio 1.91:1 (1200×630). Photorealistic or refined digital art — whichever reads cleaner at thumbnail size.
```

## After generation

1. Download the image and optionally compress with [Squoosh](https://squoosh.app/) (WebP ~80–85 quality).
2. Save it in this repo as **`public/images/blog-og-default.webp`** (see `public/images/README-blog-og.txt`).
3. Commit and deploy — blog pages and social previews use that file automatically.

**Optional later:** upload the same file to Cloudflare R2 and set **`BLOG_OG_IMAGE_URL`** on Vercel (see [R2_STORAGE.md](./R2_STORAGE.md)) instead of serving from `public/`.

## Tweaking

If the result is too busy, add: *“Even simpler — only background gradient and one gold arc.”*

If it feels too cold, add: *“Slightly warmer bone-toned highlight (#F2EBDD) at 5% opacity in one corner.”*

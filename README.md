# Libretour

NZ tourism B2B training & certification platform. MVP for activity demo in 2 weeks.

## Status

- Static design preview: [`preview/index.html`](preview/index.html) — done, open in browser
- Two-week build plan: [`SETUP.md`](SETUP.md)
- D1 schema: [`infra/schema.sql`](infra/schema.sql)
- Cloudflare bindings: [`web/wrangler.jsonc`](web/wrangler.jsonc)
- Seed content (NZSki Coronet Peak): [`seed/operators/nzski/courses.json`](seed/operators/nzski/courses.json)

## Stack (Cloudflare-only for MVP)

Pages (Next.js) · D1 · R2 · Stream · Vectorize · Workers AI · Queues · Anthropic Claude · Clerk · Resend · Tavily

Anything Workers can't run is **stubbed** in the demo and listed in [SETUP.md §2](SETUP.md). Primary stub: PDF/PPTX parsing — operator dashboard shows a fake parsing progress bar; content is pre-extracted offline via the Python scripts in [`seed/scripts/`](seed/scripts/).

## Layout

```
.
├── preview/                  # static HTML mockup
├── web/                      # Next.js on Cloudflare Pages
├── infra/                    # D1 schema + migrations
├── seed/                     # offline-extracted operator content
│   ├── scripts/              # Python: pdfplumber + python-pptx
│   └── operators/<slug>/     # one folder per operator
└── Products/                 # raw partner-provided PDFs/PPTX (gitignored)
```

## Next steps (in order)

1. `npm create cloudflare@latest web -- --framework=next --platform=pages` — scaffold Next.js
2. Replace generated `wrangler.jsonc` with the one in this repo, then `wrangler d1 create tourtrain-db` and patch the database_id
3. `wrangler d1 execute tourtrain-db --file=infra/schema.sql --local` then `--remote`
4. Install Clerk, wire `<ClerkProvider>` and middleware
5. Build the homepage + course list, hooked to seeded NZSki content
6. Continue per [SETUP.md §4 schedule](SETUP.md#4-two-week-schedule)

## Seed extraction (already runs)

```bash
pip install pdfplumber python-pptx
python3 seed/scripts/extract_pdf.py \
  "Products/NZSki/2026 Media Kit refresh - Coronet Peak.pdf" \
  --out seed/operators/nzski/blocks/coronet-peak-media-kit.json
```

Output is reviewed by hand and curated into `seed/operators/<slug>/courses.json` — that file is the source of truth applied to D1.

## What this isn't

Not yet: real PDF/PPTX upload pipeline, full i18n beyond EN + 简体中文, LinkedIn share OG worker, Stripe billing, leaderboards. All listed in [SETUP.md §8](SETUP.md).

# Libretour — MVP Setup (Cloudflare-only)

> Two-week build, single demo target. Pure Cloudflare stack.
> Anything that doesn't run on Workers is **stubbed with seed data** for the demo and flagged here for v0.2.

## 1. Stack

| Layer | Cloudflare service | Status |
|---|---|---|
| Frontend + SSR | **Pages** (Next.js 15 App Router via `@opennextjs/cloudflare`) | Real |
| Relational DB | **D1** (SQLite at edge) | Real |
| Object storage | **R2** (PDFs, images, badge PNGs) | Real |
| Video | **Stream** (HLS, embedded player) | Real |
| Vector store | **Vectorize** (1024-dim, cosine) | Real |
| Embeddings | **Workers AI** `@cf/baai/bge-m3` (multilingual) | Real |
| LLM | **Anthropic Claude Sonnet 4.6** via Workers `fetch` (AI Gateway) | Real |
| Async jobs | **Queues** | Real (light use) |
| Email | **Resend** (one-shot magic-link login) | Real |
| Auth | **Clerk** | Real |
| i18n | **next-intl** (EN + 简体中文 hand-translated; ja/ko/de/es machine-translated fallback) | Real |

## 2. What's stubbed for the demo

| Capability | Reason | Demo behaviour | v0.2 plan |
|---|---|---|---|
| **PDF / PPTX parsing on upload** | `officeparser`, `pdfjs-dist` don't run cleanly in Workers V8 isolate | Operator dashboard shows the upload UI + a fake parsing progress bar (~25s scripted). Underlying course content is **pre-extracted offline** by us using Python `pdfplumber` + `python-pptx`, committed to `seed/operators/` and loaded into D1 via `wrangler d1 execute` | Move parsing to a Fly.io worker or Cloudflare Containers consuming a Queue |
| **Image extraction from PDFs** | Same V8 limits, plus memory | We hand-pick the 44 Hermitage photos already provided; PDFs in seed are text-only | Same as above |
| **Operator self-signup verification** | NZ company-number lookup not built | Manual: I (admin) create operator accounts pre-demo | Add `nzbn.govt.nz` API lookup later |
| **Badge LinkedIn share** | OG image generation needs more work | Generate a static PNG with operator name + badge name + verify URL; LinkedIn share button opens a pre-filled compose with the verify URL | Dynamic OG image worker |
| **Anti-cheat ≥30s page dwell** | Easy but cosmetic | Implemented (real) | — |
| **Translation of operator content** | Quality / cost | EN + 中文 hand-translated for **3 demo courses**; rest of UI uses Claude Haiku on-demand translation, cached in D1 | Pre-translate all on upload via Queue |

## 3. Repo layout

```
/Users/zhuguoxin/AITourism/
├── Products/                # Source PDFs/PPTX provided by partner (do not commit)
├── preview/                 # Static HTML mockup (already done)
├── web/                     # Next.js app (Pages)
│   ├── src/app/             # App Router routes
│   ├── src/lib/             # auth, db, rag, i18n, claude
│   ├── messages/            # next-intl translation JSONs
│   ├── wrangler.jsonc       # Cloudflare bindings
│   └── ...
├── infra/
│   ├── schema.sql           # D1 schema
│   ├── seed.sql             # generated from seed/operators
│   └── migrations/
├── seed/
│   ├── operators/           # one folder per operator, hand-extracted JSON
│   │   ├── nzski/
│   │   │   ├── courses.json
│   │   │   └── blocks/
│   │   ├── hermitage/
│   │   ├── kjet/
│   │   ├── ultimate-hikes/
│   │   ├── southern-discoveries/
│   │   └── canopy-tours/
│   └── scripts/             # Python extractors (pdfplumber, python-pptx)
└── SETUP.md                 # this file
```

## 4. Two-week schedule

| Day | Owner | Deliverable |
|---|---|---|
| **D1 (today)** | tech | SETUP.md, schema.sql, wrangler.jsonc, NZSki seed sample committed |
| D2 | tech | `npm create cloudflare` scaffold, Clerk auth, marketing/home page wired |
| D3 | tech | D1 migrations applied, course/module/block models, course list page (EN) |
| D4 | tech | Course learning page + video embed (Stream), progress tracking, ≥30s dwell |
| D5 | tech | Seed extractors for remaining 5 operators (Python scripts) |
| D6 | tech | Vectorize ingestion job, embedding pipeline (Workers AI bge-m3) |
| D7 | tech | RAG endpoint, Claude streaming, source citation, Tavily web fallback |
| D8 | tech | AI sidebar on learning page, multi-turn convo, language auto-match |
| D9 | tech | Operator dashboard (KPIs, course CRUD, fake parsing UI, learner table) |
| D10 | tech | Badge issuance + verify page + static PNG generation |
| D11 | both | i18n: EN + 简体中文 strings filled; on-the-fly content translation cache |
| D12 | both | Demo content polish (NZSki / Hermitage / KJet), demo script rehearsal |
| D13 | tech | Bugbash, perf pass, Cloudflare Stream / Vectorize quota check |
| D14 | both | Activity demo |

## 5. Required accounts / keys (do before D2)

- [ ] Cloudflare — Workers Paid Plan ($5/mo)
- [ ] Anthropic — API key (Claude Sonnet 4.6 access)
- [ ] Clerk — new application, get publishable + secret keys
- [ ] Resend — domain verification (`tourtrain.co.nz` or staging)
- [ ] Tavily — API key for web fallback
- [ ] GitHub repo — `tourtrain/tourtrain`, push private

## 6. Demo script (for the activity, 8 minutes)

1. **Hook (1 min)** — Open homepage. "There are 200+ tourism operators in NZ. Travel agents sell what they remember. We make every operator's product trainable in 15 minutes."
2. **Agent flow (3 min)** — Log in as Sarah W. → browse NZSki → start Coronet Peak module 3 → watch 30s of video → mark complete → ask AI in 中文 "Heli Privates 适合什么水平?" → answer cites PDF source → switch UI to 中文 → continue learning.
3. **Operator flow (3 min)** — Log in as NZSki admin → dashboard KPIs → click upload → drag a real PDF → fake parsing progresses → "Top questions agents ask" panel → highlight one gap ("snow-day cancellation policy — 47 asks, no answer") → click "Add to course".
4. **Verify badge (1 min)** — Open Sarah's profile → click badge → public verify URL with operator branding → "this is what an agent puts on LinkedIn".

## 7. Risks / unknowns

- **Cloudflare Stream upload UX** — first upload from web takes a minute; pre-upload demo videos.
- **Workers AI bge-m3 quota** — free tier is generous, but seed ingestion of 6 operators = ~2000 chunks. Run it once early.
- **Claude rate limits** — use AI Gateway to add request caching for the demo prompts.
- **Hermitage photo licensing** — confirm with partner we can use them on a public demo URL.
- **Live demo network** — bring own hotspot; Cloudflare Pages is fast but venue WiFi varies.

## 8. Out of scope for MVP (parking lot)

- Points / leaderboards
- Buyer-side agency admin accounts
- Mobile app
- Deep anti-cheat (face/quiz)
- Operator-to-operator content licensing
- Payments (Stripe; subscription model — see commercial memo)

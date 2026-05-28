# Libretour — Activity Demo Script

> 8 minutes · live walkthrough · production URL: <https://libretour.com>
>
> Audience: NZ tourism operators + potential pilot partners. Goal of the demo
> is to land **one pilot operator agreement** by end of week, not to sign
> contracts on stage.

---

## Pre-demo checklist (do this 30 min before)

- [ ] **Sign in** at the prod URL as `zhuguoxin@gmail.com` (admin allow-list).
      After landing on `/learn`, the **Admin** pill appears in the topbar.
- [ ] **Grant yourself NZSki operator** in `/admin` → find your row → select
      `NZSki` + `admin` → click **Grant**. The **Operator console** pill appears.
- [ ] **Sign up a second account** in an incognito window
      (e.g. `<your-name>+agent@gmail.com`) so you can show the "agent's view"
      vs the "operator's view" side-by-side without logging in/out on stage.
- [ ] **Pre-warm the AI**: open the home page, ask once
      "What's the difference between Coronet Peak and The Remarkables?"
      so the first SSE roundtrip in the demo doesn't pay cold-start cost.
- [ ] **Swap the demo video** (optional but recommended): the Coronet Peak
      lessons module currently embeds Big Buck Bunny as a working YouTube
      placeholder. Replace the `video_uid` in
      `seed/operators/nzski/courses.json` with a real NZSki YouTube ID
      (format: `yt:<id>`), then:
      ```bash
      python3 seed/scripts/build_seed_sql.py
      cd web && npx wrangler d1 execute tourtrain-db --remote --file=../infra/seed.sql
      ```
- [ ] **Hotspot**: bring your own. Venue WiFi often blocks Clerk's OAuth
      handshake on first connect; mobile hotspot is more reliable.
- [ ] **Demo browser**: Chrome incognito, zoom 110%, tabs:
      1. `https://libretour.com` (anonymous, EN)
      2. signed-in admin/operator window
      3. (optional) signed-in agent window
- [ ] **Phone**: Have one ready to show the responsive layout — open the
      same URL on iPhone Safari and show the two-row mobile header.

---

## Demo flow (8 min)

### 0:00 — 1:00 · Hook (anonymous home)

Open <https://libretour.com> in the anonymous tab.

> "There are over 200 tourism operators in NZ. Travel agents sell what they
> remember. Today most operator training happens through PDFs, trade-show
> hand-outs, and email threads — which means 80% of what an operator wants
> agents to know never lands.
>
> Libretour is the platform we're building to fix that. Every operator can
> upload their existing materials, agents earn verifiable badges, and there's
> an AI assistant grounded in operator content so agents can answer client
> questions in real time."

Point to the six operator cards. Highlight NZSki is live with three real
courses extracted from their 2026 Media Kits. The other five are seeded
placeholders showing what the marketplace looks like when fuller.

### 1:00 — 1:30 · Language switch (the wow moment)

Click the **EN** picker in the topbar → switch to **简体中文**.

The entire interface re-renders in Chinese — hero, CTAs, cards, AI prompts.
Switch back. Say:

> "The Chinese inbound market is 22% of NZ's pre-COVID international tourism
> revenue. Most agent training today is English-only. We support seven UI
> languages, and our AI can answer in 30+ — the operator only has to upload
> their content once in English."

### 1:30 — 3:00 · Agent flow

Click the **Coronet Peak 2026** card (NZSki, live). The course page loads
with three columns:

- **Left** — five-module curriculum: overview, lifts & terrain, lessons,
  pricing, booking.
- **Centre** — current module reader with a real video block (yt embed), a
  callout for the Snow Factory and Premium Heli Privates, and pricing.
- **Right** — an **Ask about this course** AI sidebar.

Walk through one module quickly. Show the "Stay on this page 30s" timer:

> "Anti-cheat is built in. The button only enables after 30 seconds of dwell
> time, and the timer pauses when the tab is hidden — so agents can't farm
> badges in the background."

When the button enables, click **Mark complete & continue**.

### 3:00 — 4:30 · AI Q&A (the killer feature)

In the right sidebar, type in Chinese:

> **客户问 Heli Privates 适合什么水平?**

The answer streams in Chinese, with a citation chip linking back to the
NZSki Premium Heli Privates source PDF.

> "The AI is grounded in the operator's own course content — every answer
> cites the source. The agent can click the citation to land exactly on the
> module that backs the answer. This is the difference between 'an LLM that
> hallucinates about NZ tourism' and 'NZSki's product knowledge made instantly
> searchable in any language'."

Try one more question to show variety:

> **Snow-day cancellation policy**

Citation should land in the Booking & FAQ module.

### 4:30 — 6:00 · Operator dashboard (the value to the partner)

Switch to the signed-in window. Click **Operator console** in the topbar.

Talk through the four KPI cards: total learners, courses published, badges
awarded, AI questions. Note that all numbers are live from D1, not mocked.

Scroll to the **Top questions agents ask** panel:

> "This is the part operators have never had before. We show you exactly
> what agents are asking in real time — colour-coded by whether your content
> answered it, the AI fell back to the web, or there was no answer at all.
>
> Look at this: there's a question category here we couldn't answer from
> your content. That's not a failure — it's a content gap, surfaced to you
> automatically. The operator that closes it first wins the agent's loyalty."

Scroll to **Recent learner progress** to show real names + agencies +
progress bars + badge states. Mention CSV export is coming.

Scroll up to the **Upload content** zone. Click on it. The alert explains
parsing is currently offline-only — flag this as known and intentional:

> "We pre-extract for our pilot operators by hand using Python tooling we
> wrote. Self-serve parsing wires up in v0.2 via Cloudflare Containers."

### 6:00 — 7:00 · The badge & verify URL

Switch back to the agent window. After completing a course, copy the badge
verify URL. Open it in a third tab (anonymous):

> "Anyone can verify a badge with just the URL — no account needed. Agents
> can put this in their email signature, on LinkedIn, on their agency
> profile. The operator's brand travels with it."

Walk through the verify page: operator name, course title, learner name,
verify code.

### 7:00 — 8:00 · Business model, ask, close

> "The economics: agents are always free. Operators pay a SaaS subscription
> — Starter NZ$199/month, Pro NZ$499/month with analytics, Enterprise from
> NZ$1,500/month with multi-account and white-label. The first five pilot
> operators are free in exchange for content and feedback.
>
> Our ask today: who in this room wants to be one of those five? We'll
> hand-extract your existing materials, set up your console, and have you
> live in a week."

End on the prod URL one more time. Have a one-page leave-behind with the
URL + your contact.

---

## Backup talking points (if something breaks)

- **AI Q&A is slow / fails** → "Cloudflare Workers AI runs at the edge but
  bge-m3 embeddings need a warm route. Skip to the operator dashboard —
  same data story without the live call."
- **Stream video won't play** → "We default to a YouTube fallback for the
  demo since each operator's videos live on their own Stream tenant in
  production. Skip past the video; the rest of the module is the point."
- **Sign-up doesn't work / Clerk handshake loop** → almost always the venue
  WiFi blocking Clerk. Switch to your hotspot and refresh.

## Numbers to be ready for

- **NZSki Coronet Peak 2026** course: 5 modules, ~25 min, 12 content blocks
- **Total seeded**: 6 operators, 9 courses (3 NZSki published + 6 placeholder
  Coming Soon), 15 modules, ~38 content blocks
- **RAG**: 37 content chunks live in Cloudflare Vectorize (bge-m3,
  1024-dim, cosine)
- **Stack**: Next.js 16 + OpenNext + Cloudflare Workers + D1 + R2 + Stream
  + Vectorize + Workers AI + Clerk + Anthropic Claude Sonnet 4.6
- **Build time**: zero-to-deployed in **2 weeks** (the duration of this
  demo's countdown). Real production-grade stack throughout, no fakery
  except the upload-parsing pipeline (which is offline-only for now, by
  design).

## After the demo

If a pilot says yes:
1. Add their domain emails to `ADMIN_EMAILS` or assign them via `/admin`.
2. Run `seed/scripts/extract_pdf.py` against their PDFs.
3. Hand-curate into `seed/operators/<their-slug>/courses.json`.
4. Apply seed to D1 (`build_seed_sql.py` + `wrangler d1 execute`).
5. Run reindex: `curl -X POST -H "x-reindex-token: $TOKEN"
   https://libretour.com/api/admin/reindex`.
6. Onboard their staff via `/admin` → grant `operator` role.

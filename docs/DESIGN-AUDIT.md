# Island Haven (آيلاند هيفن) — Design Audit

Senior product-design audit of the 12 requested issues, **grounded in the actual
codebase** (not the brief's assumptions). Where the brief and the build disagree,
the build wins and is cited by file. Constraints honored throughout: RTL-perfect
AR+EN · dark default · brand accent locked · honest data only · reduced-motion ·
Gaza-bandwidth performance · Tailwind v4.

---

## 0. Reality check — the brief vs. the build

| Brief said | Actual (cited) |
|---|---|
| Next.js / Astro | **React 19 + Vite + Tailwind v4** (`import.meta.env`, wouter, TanStack Query, framer-motion) |
| Accent `#E8500A` (orange) | **`--primary: hsl(12 70% 52%)` ≈ `#E8341C` "Island red"** (`index.css:141`) — brand-locked, unchanged |
| Gold is a "cerulean" | **`--sand-bright: hsl(40 58% 68%)` ≈ `#E8C08A` warm gold** (`index.css:177`) — no cerulean exists |
| No light mode | **`.theme-light` already exists**, AA-tuned (`index.css:287–314`), applied per-section (HoursLocation, HomeFAQ) |
| Background near-black | **`--background: hsl(24 9% 4%)` ≈ `#0b0a09`** warm near-black (`index.css:115`) |

Net: the design system is more mature than the brief assumes, so several "issues"
were already solved. This audit does **not** re-solve solved problems.

---

## Part 1 — Audit Report

Severity key: 🔴 Critical · 🟠 High · 🟡 Medium · ⚪ Low/None.
Verdict key: **OPEN** (fixed this pass) · **DONE** (already handled) · **N/A** (inaccurate).

| # | Issue (as briefed) | Verdict | Sev | Root cause / reality | User impact | Before → After |
|---|---|---|---|---|---|---|
| 1 | /book step-1 empty viewport | **DONE** | ⚪ | `Book.tsx` step 1 renders a two-column **calendar + time-slot** grid immediately (no async, no scroll) | None — picker is visible on load | already correct |
| 2 | Hero stats "cut off" | **DONE** | ⚪ | `Hero.tsx` proof bar uses `border-s border-white/[0.22]` dividers + a bottom scrim for AA contrast | Reads as a clean 50·57·100% bar | already correct (reworked prior pass) |
| 3 | Navbar 7+ competing | **DONE (note)** | 🟡 | `Header.tsx` has ~13 elements **but** a real hierarchy: mega-menu consolidates 15 links; CTAs color-coded rightmost; utilities icon-only; login hidden `<xl` | Dense but navigable; no truncation | no restructure — density-trim noted in Part 2 |
| 4 | Expert avatars inconsistent | **OPEN → fixed** | 🟠 | THREE divergent fallbacks: ExpertsBand (24px gold-ring, 2-char) vs `/experts` chips (10px border-only, 1-char) vs grid panel (large 1-char); grid also used **off-brand emerald** for "Open" | A mentor looked different on every surface; green broke the palette | **unified `<ExpertAvatar>`** (photo/initials, gold ring, 2-char, brand availability dot); emerald → terracotta |
| 5 | Ventures ticker clash | **N/A** | ⚪ | `Ventures.tsx` puts the sector ticker in a separate `lg:col-span-5` grid column, not over the heading | None — no overlap | no change |
| 6 | Members toolbar mixes CTA+tabs | **OPEN → fixed** | 🟠 | `Members.tsx` nested "Join as freelancer" into the filter-tab flex row (`ms-1`) | CTA read as just another filter chip | **three zones**: search · filters · action (hairline-split on lg, own line on mobile) |
| 7 | Floating widgets overlap | **N/A** | ⚪ | `FloatingContact` is bottom-**left** (`start-5`); **no asterisk widget exists**; ⌘K is a full-screen modal, not a corner button | None — corners are clear | no change |
| 8 | Partner logos below fold | **DONE** | ⚪ | `CredibilityBar` renders directly under the hero (`Home.tsx`), above the fold, as honest text wordmarks; a richer Partners section sits below by design | Trust proof is already in-viewport | no change |
| 9 | About text-heavy | **DONE** | 🟡 | `About.tsx` already breaks prose with a **timeline** (year nodes), a stat bar, and a full-bleed photo | Adequate rhythm | optional enrichment noted |
| 10 | Investors no download CTA | **OPEN → fixed** | 🟠 | Only mailto + WhatsApp existed | Investors couldn't self-serve a deck/data-room | **honest-gated investor-materials module** (renders only when a real URL is set) |
| 11 | No light / investor view | **OPEN → fixed** | 🟡 | `.theme-light` tokens existed but were never exposed to users | No corporate/lighter view for investors | **opt-in "Investor view" toggle** on `/investors` (dark stays default, persisted) |
| 12 | World map lacks affordance | **DONE** | ⚪ | `GazaToGlobal.tsx` already has scroll-drawn arcs, node hover/focus, ripples (paused offscreen), aria-labels, and a live caption region | Already interactive + accessible | no change |

**Summary:** 5 already-done, 2 inaccurate, 1 note-only, **4 genuinely open — all fixed this pass** (#4, #6, #10, #11).

---

## Part 2 — Component Redesign Specs

### 2.1 Hero Stats Bar — *documented (already shipped)*
The requested redesign already exists in `Hero.tsx`. Spec of the shipped bar:
```
┌───────────────────────────────────────────────┐  ← bottom scrim (AA contrast)
│  ٥٠            │  ٥٧            │  ١٠٠٪          │
│  مقعد          │  منتسب         │  مجّانيّ        │
└──────┬─────────┴──────┬────────┴───────────────┘
       border-s white/22 (RTL-correct)
```
- Figures: `t-h2 !text-sand-bright tnum` (gold), count-up gated to after headline; **capacity 50** sourced from the live attendance summary (matches SeatsBoard + WhatYouGet — no contradiction).
- Dividers: `border-s border-white/[0.22]` on every stat but the first (`ps-0`).
- Only real nit: give the bar a touch more bottom breathing room on very short viewports (`pb` already `7→9`). No structural change needed.

### 2.2 Expert / Mentor Card — `<ExpertAvatar>` (NEW, shipped)
One avatar treatment everywhere. `components/ui/ExpertAvatar.tsx`, built on the
Radix Avatar primitive (graceful fallback if a photo URL 404s).
```
 PHOTO state            INITIALS state (no photo)     with availability
 ╭───────╮  gold ring   ╭───────╮  gold ring          ╭───────╮
 │ 🖼 img │  1px 40%     │  مج   │  gold-on-glass       │  مج  ●│ ● terracotta = accepting
 ╰───────╯              ╰───────╯  2-letter            ╰───────╯   muted = waitlist
   sm=40 · md=56 · lg=96 (shared scale)
```
- Props: `{ name, avatarUrl?, size: "sm"|"md"|"lg", accepting?, className }`.
- Fallback: shared `initials()` (skips honorifics م./أ./د.), `text-sand-bright` on `bg-white/[0.04]`, gold ring — identical to the photo ring.
- Availability dot only when `accepting` is defined; **brand terracotta**, never the old emerald.
- RTL-safe (`end`), no self-animation (hover/scale belongs to the card).
- Adopted in: `ExpertsBand` (lg), `/experts` chips (sm); `/experts` grid keeps its rectangular cover but now uses the shared 2-char initials + brand availability color.

### 2.3 Navbar — *documented hierarchy + optional trim*
Current 3-audience hierarchy is sound (don't rebuild):
```
[Logo]  Home Jobs Investors Partners  ⌄Explore      [🔍] [ﻉ] · Login · [Book] [APPLY]
 brand   ── neutral gray nav ──   mega-menu(15)     ── icon utilities ──  secondary  PRIMARY
```
- Founders → Apply/Book (primary, color-coded). Investors/Partners → top-level links. Everyone → Explore mega-menu.
- **Optional CRO trim** (recommendation, not required): on `lg–xl`, fold "Jobs" into Explore and drop the desktop search to icon-only earlier, leaving Apply/Book unrivaled. Ship behind measurement, not taste.

---

## Part 3 — Code (the real fixes)

> The brief's Part-3 targets (overlapping floats #7, responsive stat bar #2) are
> already satisfied — see Part 1. Real code shipped this pass:

**`<ExpertAvatar>`** — see `components/ui/ExpertAvatar.tsx` (photo/initials, gold
ring, `accepting` dot). Adopted across ExpertsBand + `/experts`.

**Members toolbar — three zones** (`pages/Members.tsx`):
```html
<div class="… flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
  <div class="relative lg:flex-1"> …search… </div>                     <!-- zone 1 -->
  <div role="group" aria-label="Filter members" class="flex …flex-wrap"> …tabs… </div> <!-- zone 2 -->
  <div class="lg:border-s lg:border-white/10 lg:ps-4">                  <!-- zone 3 -->
    <a href="/apply?type=freelancer" class="… w-full lg:w-auto …">Join as freelancer</a>
  </div>
</div>
```

**Investor view toggle** (`pages/Investors.tsx`) — reuses `.theme-light`, scoped to
this page, persisted:
```tsx
const [investorView, setInvestorView] = useState(() => localStorage.getItem("ih-investor-view") === "1");
useEffect(() => { localStorage.setItem("ih-investor-view", investorView ? "1" : "0"); }, [investorView]);
return <div className={investorView ? "theme-light" : undefined}><PageShell …/></div>;
```
Segmented control (`Dark` ↔ `Investor view`), `aria-pressed`, brand accent in both states.

**Investor materials module** — honest gate:
```tsx
const INVESTOR_DECK_URL: string = "";   // ← set to a real deck/data-room URL
{INVESTOR_DECK_URL && <MaterialsCard href={INVESTOR_DECK_URL} … />}   // else contact CTAs stand alone
```

---

## Part 4 — Missing pages / features (vs. YC · Techstars · Gaza Sky Geeks)

The sitemap is already broad (Alumni, Press, Media, Careers, Blog, FAQ, Process,
Cohorts, Programs, Ventures, Events, Team, Transparency…). Genuine gaps worth adding:

1. **Investor data room** — beyond the deck (#10): a gated metrics/docs room (DocSend/Notion). *Highest leverage for the investor audience.*
2. **Audience-segmented entry** — a "For founders / For investors / For partners" path chooser (YC/Techstars pattern). The three audiences currently share one funnel.
3. **Dated impact / transparency report** — an annual, public outcomes page (GSG publishes these). You have `/numbers` + `/transparency`; a narrative, dated report builds donor/investor trust.
4. **"What we look for" application rubric** — a concrete acceptance-criteria page to de-risk applying and lift completion (`/process` can host it).
5. **Newsletter / cohort-alerts capture** — a lightweight subscribe for "next cohort opens" — cheap lead nurture for founders not ready today.
6. **Alumni outcomes ("where are they now")** — `/alumni` exists; add measurable trajectories (revenue, hires, markets) as social proof.

---

## Part 5 — Homepage A/B hypotheses (goal: applications submitted)

Primary metric unless noted: **apply-form starts** (click → `/apply` load) and the
downstream **submit rate**.

1. **Benefit-led hero CTA.** *If* the primary CTA reads "احجز مقعدك المجاني / Claim your free seat" instead of "قدّم على الحاضنة / Apply", *then* apply-starts rise, *because* the free-seat benefit is more concrete than the process verb. Guard: don't cannibalize the Book CTA — measure both.
2. **Live seat-scarcity in the hero.** *If* the seat stat shows "N of 50 free" (live) instead of the static "50 seats", *then* apply-starts rise via honest scarcity — *but only if* free-count stays truthful (it's API-driven). Watch for backfire when free is high.
3. **Proof-early.** *If* a mentor-face row (`<ExpertAvatar>` strip) + one success metric moves above the fold, *then* apply-starts rise *because* credible faces reduce "is this real?" hesitation for a war-context audience.
4. **Single-action hero.** *If* the hero shows Apply only (Book demoted below the fold), *then* apply-starts rise via reduced choice, *because* dual equal CTAs split intent. Risk: fewer bookings — track both funnels.
5. **Expectation interstitial.** *If* `/apply` opens with a 3-step "what to expect · 15–30 min · free" preface before the form, *then* submit-rate rises (fewer abandons) even if starts dip slightly — *because* clarity lowers form anxiety. Net metric = completed submissions.

Run one variable at a time; segment by locale (AR/EN) and device — the AR-mobile
cohort on constrained bandwidth may respond differently to #2 and #3.

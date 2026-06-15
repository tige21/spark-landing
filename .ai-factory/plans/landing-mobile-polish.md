# Plan: Mobile UX polish (header, hero, video, spacing)

**Branch:** feature/landing-build (stay; no branch off main)
**Created:** 2026-06-15
**Mode:** full · Settings: tests no, docs yes, logging standard

## Goal
Tighten the mobile experience based on the on-device analysis: compact header, shorter
CTA, hero text raised above the press, full press visible (less crop), and denser section
spacing.

## Mobile UX findings (390px)
- Header too tall: brand "Spark Cards" wraps to 2 lines; "Открыть в Telegram" wraps to 2 lines.
- Hero headline overlaps the press focal point; subtitle low-contrast.
- Hero video cover-crops the press edges (станок doesn't fit).
- "What" cards: tiny stamp floating with huge internal padding + big gaps.
- "How" steps: large vertical gaps between stacked steps.
- General mobile rhythm too sparse.

## Decisions (with user)
- CTA label → **«Играть» / «Play»** (one line), header + hero, stays primary.
- Brand → **«Spark»** on mobile (keep «Spark Cards» on desktop).
- Mobile video → show the **full press** (regenerate `hero-mobile` without the hard 9:16 crop; display contained), not cover-cropped.

## Tasks
- [ ] #103 Mobile header — "Spark" brand on mobile, one-line «Играть» CTA (header+hero, nowrap), smaller header padding. (Nav.astro, config/site or page props, TelegramCTA.tsx)
- [ ] #104 Hero mobile — raise content above the press (align-top + padding), subtitle legibility. (HeroScroll.css)
- [ ] #105 Hero mobile video — regenerate `hero-mobile` full-press frames (≤~1MB) + `fit:'contain'` on mobile so the whole станок fits; match poster. (frames, CanvasSequence.tsx, HeroScroll.css)
- [ ] #106 Mobile spacing pass — Section padding, What card padding/gap/stamp, How step gaps, others (≤760px). (Section.astro, What.astro, How.astro, …)
- [ ] #107 Build + smoke 10/10 + Playwright mobile+desktop verify + deploy + docs. *(blocked by #103–#106)*

## Commit Plan
- After #103 — `style(landing): compact mobile header + short CTA`
- After #105 — `feat(landing): mobile hero — raised text + full-press video`
- After #106 — `style(landing): tighten mobile spacing`
- After #107 — `chore(landing): verify + ship mobile polish`

## Risks
- Mobile video `contain` leaves cream bands top/bottom — design the layout (text above press) so it reads intentional, not empty.
- Don't regress desktop — scope changes to ≤760px media queries where possible.

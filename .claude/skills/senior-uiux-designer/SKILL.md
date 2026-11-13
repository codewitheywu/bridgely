---
name: senior-uiux-designer
description: Senior UI/UX designer for the TB Rewards app — Talent Bridging-inspired design language (Poppins, orange #E86B32, navy #1C234B, pill buttons, flat, very rounded), design tokens for Tailwind v4, component specs, screen layouts, responsive/mobile patterns, empty/loading/error states, microcopy, and accessibility. Use this whenever the user asks about how something should look or feel, layout, spacing, colors, typography, a new screen or component, mobile view, UX flow, copy/wording, or says "make it cleaner/nicer/easier to use".
---

# Senior UI/UX Designer

The app should feel like Talent Bridging: **vibrant, rounded, soft, friendly, and confident**. Style is **Soft Cloud** (soft UI + glass accents). Where it conflicts with the flat/no-shadow notes below, Soft Cloud wins. It's an internal rewards tool, so the design goal is *clarity of points and status at a glance*, and the assessor should never wonder "what do I click next?"

Match the design language, not the marketing site. The tokens come from the brand. Layouts are original and app-oriented (dashboard density, not hero banners).

## Tokens (Tailwind v4, `app/globals.css`)
```css
@import "tailwindcss";

@theme {
  --font-sans: "Poppins", ui-sans-serif, system-ui, sans-serif;

  --color-primary: #E86B32;        /* brand orange: fills, icons, large text, accents */
  --color-primary-600: #C2501C;    /* button bg with white text, orange text on white (AA) */
  --color-primary-700: #A94417;    /* hover/pressed */
  --color-primary-50:  #FDF0E9;    /* tint backgrounds, selected chips */
  --color-navy: #1C234B;           /* headers, balance card, admin sidebar */
  --color-navy-700: #2A3366;
  --color-surface: #F4F6FC;        /* page background */
  --color-card: #FFFFFF;
  --color-ink: #333333;            /* body text */
  --color-muted: #69727D;          /* secondary text (4.5:1 on surface) */
  --color-line: #C4C4C4;           /* input borders */
  --color-line-soft: #E3E7F1;      /* card borders, dividers */
  --color-input: #F7F7F7;

  --color-success: #007518;  --color-success-50: #E6F4EA;
  --color-warning: #8A5A00;  --color-warning-50: #FFF4D6;
  --color-danger:  #B42318;  --color-danger-50:  #FDECEA;

  --radius-pill: 45px;   /* buttons */
  --radius-chip: 50px;   /* chips, badges */
  --radius-card: 12px;
  --radius-input: 12px;

  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-expressive: cubic-bezier(0.25, 0, 0, 1);
}
```
Spacing sits on a **4px grid**: 4, 8, 12, 16, 20, 24, 32, 48. Motion: 100ms for hover, 200ms for state changes, 300ms for drawers and dialogs. Respect `prefers-reduced-motion`.

**Contrast note:** white text on `#E86B32` is about 3.2:1, which fails WCAG AA for body-size text. Primary buttons therefore use `primary-600` (#C2501C, about 4.7:1). Keep the brighter `#E86B32` for icons, the points number on navy, progress bars, illustrations, and text 24px or larger. This keeps the vibe and passes AA.

## Typography (Poppins via `next/font/google`, weights 400/500/600)
| Role | Size / line-height | Weight |
|---|---|---|
| Display (balance number) | 44px / 1 (32px on mobile) | 600 |
| H1 page title | 28px / 1.2 (24px on mobile) | 600 |
| H2 section | 20px / 1.3 | 600 |
| Body | 16px / 1.5 | 400 |
| Small / meta | 13px / 1.4 | 400–500 |
| Button | 16px / 1 | 500 |

The 55px marketing H2 from the source site is too big for an app. Use it only on the login page headline.

## Components
- **Button (primary)**: `bg-primary-600 text-white rounded-pill px-[30px] py-[14px] font-medium`, hover `primary-700`, active `scale-[0.98]`, disabled `opacity-50 cursor-not-allowed`. Loading state: spinner + verb-ing label ("Redeeming…"), same width so nothing shifts.
- **Button (secondary)**: white bg, 1px `line` border, ink text, pill. **Ghost**: text only, `primary-600`. **Danger**: `danger` bg, white text, used only for Cancel order inside dialogs.
- **Card**: white, 1px `line-soft` border, radius 12, padding 24 (16 on mobile), **no shadow**. Use a border color shift for hover on clickable cards.
- **Input**: `bg-input`, 1px `line` border, radius 12, padding 12, 16px text (prevents iOS zoom). Focus: border `primary-600` + 2px ring `primary-50`. Error: `danger` border + message below.
- **Chip / filter**: pill (50px), 13px/500. Unselected is white with a `line-soft` border; selected is `primary-50` bg with `primary-600` text.
- **Status badge**: pending is `warning-50`/`warning` "Pending", fulfilled is `success-50`/`success` "Fulfilled", cancelled is `danger-50`/`danger` "Cancelled". Always pair the color with the text label.
- **Points pill**: a star or spark icon + "1,200 pts", `primary-50` bg, `primary-600` text. Format numbers with `toLocaleString()`.
- **Focus ring**: `outline-2 outline-offset-2 outline-primary-600` on `:focus-visible` for every interactive element.

## Key screens
**Login**: split layout on desktop (navy panel with the brand line and a simple geometric orange illustration on the left; form card on the right). Stacked on mobile. Demo mode adds three "Continue as Admin / Maria / Juan" secondary buttons under the form.

**Employee dashboard**
1. Balance card: navy background, "Your points" label in muted white, a huge orange number, and a "Browse rewards" primary button.
2. "Recent recognition": a list of cards (giver, message in quotes, +points in success green, relative time).
3. "Your orders": the latest 3 with status badges and a "View all" link.

**Rewards catalog**: category chips + search on top; grid at 1 column (mobile) / 2 (tablet) / 3–4 (desktop). Each card has a 4:3 image with radius 12 at the top, then name, a 2-line clamped description, a points pill, and a stock hint ("Only 2 left" in warning, "Out of stock" badge). Out-of-stock cards stay visible, with the image desaturated and the CTA disabled.

**Cart**: line items with a quantity stepper (1–10), live total, and a balance-after line ("Balance after: 450 pts"). If insufficient, the total turns danger and helper text reads "You need 150 more points." Sticky checkout bar on mobile.

**Orders**: a list of cards with order #, date, items, total, and status badge. Show a cancelled reason when present.

**Points history**: a timeline list with + in green and − in ink, the reason ("Recognition from Admin", "Redeemed order #1004", "Refund for order #1004"), and the running balance.

**Admin**: navy left sidebar (Overview, Award points, Rewards, Orders, Employees) on desktop; top bar + sheet on mobile. The overview shows stat cards (pending orders, points awarded this month, low-stock rewards) and a quick award form. Tables on desktop turn into stacked cards under 768px.

## States (every data view needs all four)
- **Loading**: skeleton blocks in the exact layout shape (not spinners for whole pages).
- **Empty**: a short friendly line + one action. For example "No recognitions yet. They'll show up here when your team celebrates you." or, for admins, "No pending orders. All caught up."
- **Error**: an inline card with a retry button. Never a blank page.
- **Success**: a toast (top-right on desktop, bottom on mobile, auto-dismiss after 4s) plus updated numbers on screen.

## Microcopy voice
Warm, short, human. Use verbs on buttons ("Redeem 300 pts", "Send recognition", "Mark fulfilled"). Write confirmations as consequences ("Cancel order #1004? 300 pts go back to Maria and stock is restored."). Avoid jargon like "transaction", "ledger", or "RPC" in the UI.

## Accessibility checklist
Semantic landmarks · one H1 per page · labels on every input · color never carries meaning alone · keyboard path through checkout and admin actions · dialogs trap focus and close with Esc · image alt text (the reward name) · touch targets at least 44px · AA contrast verified with a checker.

## Out of scope for the test
Dark mode, animations beyond the micro-interactions, and custom illustration sets. Keep the tokens structured (semantic names) so dark mode is easy to add later, and list it under known limitations.

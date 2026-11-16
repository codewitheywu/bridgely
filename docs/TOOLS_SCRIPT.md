# Interview script: "What tools did you use?"

Say the **short answer** first. If they want more, go on to the full version. Speak in your own words. These lines are a guide, not something to read word for word.

---

## Short answer (30 seconds)

> "The app is built with **Next.js** and **TypeScript**, styled with **Tailwind CSS**. The database, login and image storage are **Supabase**, which runs on **PostgreSQL**. It's deployed on **Vercel**. I used **Claude Code** in **VS Code** as my AI coding tool, and **Git and GitHub** for version control. For testing I wrote two scripts: one checks the database rules directly, and one uses **Playwright** to click through the real app in Chrome."

---

## Full answer (3–4 minutes)

### 1. Languages

> "I used four languages:
> - **TypeScript** for the whole app: pages, server code and test scripts. It's JavaScript with types, so many mistakes show up before the code runs.
> - **SQL** for the database: the tables, the security rules, and the functions that move points and stock.
> - **CSS**, written mostly through **Tailwind** classes.
> - **Markdown** for the README, the walkthrough and the decision log."

### 2. Frontend and server: Next.js

> "**Next.js 16** with the App Router, on **React 19**. I picked it because one project holds both the pages and the server code, so I didn't need a separate backend.
>
> - Pages are **server-rendered**, so data is loaded on the server and nothing sensitive is computed in the browser.
> - Forms use **Server Actions**. When the admin awards points, the form calls a server function, which calls the database.
> - A small **proxy** file (Next.js middleware) refreshes the login session and redirects logged-out users. That's for convenience only. The real permission checks happen in the database."

### 3. Styling: Tailwind CSS v4

> "**Tailwind CSS v4** for styling. I set the brand colors and the Poppins font as design tokens, then built a 'Soft Cloud' look: soft raised cards, pill buttons, and orange as the main color. I checked the text colors for contrast and tested every page at 375 pixels wide for phones."

### 4. Database: Supabase and PostgreSQL

> "**Supabase** gives me three things:
> - a **PostgreSQL** database,
> - **Auth**, for email and password login,
> - **Storage**, for reward images.
>
> I treated points like money, so the database is the source of truth.
> - Every change to points or stock happens inside one **Postgres function**: `award_points`, `redeem_cart`, `fulfill_order` and `cancel_order`. Each one runs in a **single transaction**, so it either fully happens or doesn't happen at all.
> - Every point movement is written to a **ledger table**, so there's a full history.
> - **Row Level Security** is on every table. Employees can only read their own rows, even if they call the database directly from the browser.
> - The functions check the user's role **inside the database**, so only admins can award points or manage rewards.
> - A **CHECK constraint** means a balance can never go below zero.
> - Checkout uses an **idempotency key**: one unique ID per checkout attempt. If someone double-clicks, the second request gets the same order back instead of a new one."

### 5. Other libraries

> "- **@supabase/ssr** to keep the login session in secure cookies on the server.
> - **Zod** to validate form input on the server before it reaches the database.
> - **ESLint** to catch code problems."

### 6. Hosting: Vercel

> "**Vercel** hosts the live demo at bridgely-rose.vercel.app. The secret keys are stored in Vercel's environment variables, not in the code. The Supabase service-role key, which can bypass security, is used only by my local scripts and never reaches the browser."

### 7. Testing

> "I wrote two test scripts that run against the real database:
> - `npm run verify`: **38 checks** on security and data accuracy. For example, 5 checkouts at the same time create only one order, fake prices are rejected, an employee can't make themselves admin, and every balance matches its ledger.
> - `npm run e2e`: **38 checks** using **Playwright** in Chrome, on desktop and on a phone-sized screen. It logs in as each role, redeems, cancels and checks that the points come back, and checks there are no console errors.
>
> Both scripts create temporary users and delete them afterwards, so the demo data stays clean. All 76 checks pass."

### 8. AI tools

> "I used **Claude Code** by Anthropic, inside **VS Code**. I didn't just ask it to 'build the app'. I set up role-based **skills**: team lead, web developer, UI/UX designer, database developer, security and QA. Each one carries the project rules, so the AI stays consistent. For example, the database skill always puts point changes inside a transaction.
>
> I made the decisions and reviewed the work. For example, I chose the UI style from three mockups, and I kept a decision log of why each choice was made. The AI wrote most of the code, and I checked it with the test scripts instead of trusting it blindly."

### 9. Version control

> "**Git** and **GitHub**, with small commits after each task. If something breaks, I can see exactly which change caused it."

---

## "How do you resolve a problem?"

### My method (say these five steps)

> "I follow the same five steps every time:
>
> 1. **Reproduce it.** I try to make the problem happen myself, with the same account and the same steps. If I can't reproduce it, I collect more details first.
> 2. **Gather facts.** I look at the evidence: the browser console, the Vercel logs, and the database itself. For points, I check the ledger first, because every point movement is recorded there.
> 3. **Isolate the cause.** I ask: is this a **display problem** (the page, a cache, a filter) or a **data problem** (the database is actually wrong)? I narrow it down one layer at a time: browser, then server, then database.
> 4. **Fix the root cause**, not the symptom. For example, I would never just edit a balance by hand. I'd add a correction entry to the ledger, so the history stays honest.
> 5. **Prevent it.** I add a test that reproduces the bug, so it can't come back without me knowing."

### Example 1: points problem (the one they'll probably ask about)

> "Say an employee says: 'My points were taken, but I don't see my order.'
>
> - **Gather facts:** I check that employee's ledger. Every deduction is linked to an order ID.
> - **Isolate:** If the order exists, it's a display issue, like a stale page or a filter, so I check the Orders page. If there's a deduction with no order, it's a data issue. That should be impossible, because the deduction and the order are saved in the same transaction.
> - **Fix and prevent:** I fix the cause, add a test, and run my reconciliation check, which confirms every balance equals the sum of its ledger."

### Example 2: a real bug I fixed in this project

> "After an admin awarded points, the success message, the 'toast', sometimes didn't appear.
>
> - **Reproduce:** I awarded points a few times. The points were saved correctly, so the data was fine, but the message didn't always show.
> - **Isolate:** It was a display problem. After the action, the server refreshes the page, and the part of the page that was supposed to show the message was being replaced before it had a chance to run.
> - **Fix:** I moved the message so it fires in the browser right after the action returns, not later from inside that card.
> - **Prevent:** The end-to-end test now checks that the toast appears after awarding points."

### Example 3: a seed script bug

> "My seed script, which creates the demo accounts and rewards, failed when the reward data was missing some columns. I read the error, saw it was sending empty values instead of letting the database use its defaults, and changed it to leave those columns out. Now the seed is safe to run again and again."

---

## Likely follow-up questions

**"Why Supabase and not your own backend?"**
> "It gives me Postgres, login and file storage in one place, and Row Level Security lets the database enforce permissions itself. For a project this size, that's safer and faster than writing my own auth."

**"Why put the logic in the database instead of the server code?"**
> "Because the database is the one place every request has to pass through. Even if someone skips my website and calls the API directly, the rules still apply."

**"How do you know the AI's code is correct?"**
> "I don't assume it is. I wrote 76 automated checks that test the real behavior: exact point amounts, stock, permissions and double-clicks. I ran them against the live database, and I reviewed the important parts myself, especially the database functions."

**"What would you do with more time?"**
> "Password reset, email notifications, peer-to-peer recognition and leaderboards. They're listed in the README as next steps."

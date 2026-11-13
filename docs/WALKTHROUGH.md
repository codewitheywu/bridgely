# Walkthrough script (about 8 minutes)

**Setup:** two browser windows, one logged in as **Maria** and one as **Admin**. Use a private window for the second so the logins don't clash. Rehearse once so your clicks match the numbers below.

**Before the call:**
- [ ] Live Vercel link works, and the README has the real URL and password
- [ ] `0002_demo_requests.sql` has been run, and "Allow new users to sign up" is off in Supabase
- [ ] Each reward has a real photo (Admin → Rewards → Edit)
- [ ] `npm run verify` passes

---

## 1. Approach (1 min)

> "I built TB Rewards with Next.js and Supabase, using Claude Code as my AI coding tool. I set it up with role-based skills: team lead, web developer, designer, database, security, and QA.
>
> My main decision was to treat points like money. The database owns every balance and stock change. Awarding, checking out, fulfilling and cancelling each run inside one database transaction, and every point movement is written to a ledger. So even if someone bypasses the website, the rules still hold."

## 2. Employee flow, as Maria (2 min)

**Home**
> "This is Maria's home. She has **650 points available**: she earned 1,200 and redeemed 550. Below is her recognition feed, with each award and its message."

**Points**
> "Every point movement has a reason and a running balance, and it ends at her current balance."

**Rewards**
> "Each reward has an image, a description, a price in points, and stock. I can search or filter by category. Wireless earbuds say **'Need 850 pts more'**, so she can't buy them. The hoodie is **out of stock**. The inactive reward isn't shown at all."

**Add Coffee voucher**
> "Adding it shows a confirmation, and the cart count updates."

**Cart**
> "The cart shows her balance after checkout: 500. I'll click **Redeem** several times quickly."

*Click it 2–3 times.*
> "It creates only one order. The button locks on the first click, and the database also rejects duplicates using a unique key per checkout. Her balance is now exactly 500, and the order is **Pending**."

## 3. Admin flow (2.5 min)

**Overview** (Admin window)
> "The admin sees pending orders, total points awarded, and low-stock rewards. I'll award Juan 250 points with a message."

*Award Juan 250 points with the message "Great job on the client demo!".*
> "Juan's balance goes up by exactly 250, and the message appears in his feed."

**Rewards → Edit** (any reward)
> "Admins set the price and stock, upload an image, or deactivate a reward. Rewards are never deleted, so old orders keep their history."

**Orders → Pending** (find Maria's order)
> "Here's Maria's order. I'll cancel it with a reason. The confirmation tells me exactly what happens: her points go back and the stock is restored."

*Cancel it, then switch to Maria and refresh.*
> "Maria is back to **650**, and her points history shows the refund. The coffee voucher's stock is back too."

## 4. Proving the rules (1 min)

> "Permissions aren't just hidden buttons. If Maria types `/admin`, she's sent back to her own page. Even if she called the database directly from the browser, the database would refuse: employees can only read their own rows, and only admins can award points or edit rewards.
>
> I also wrote two automated test suites, about 60 checks in total. They cover double-click checkout, 10 simultaneous checkouts, fake prices, negative quantities, self-promotion to admin, and that every balance matches its ledger."

## 5. Troubleshooting story (1.5 min)

They will ask this. Use this example:

> "Say an employee reports, 'My points were deducted, but I don't see my order.'
>
> **First, gather facts.** I check that employee's points ledger. Every deduction is linked to an order ID.
>
> **Then isolate the cause.** If the order exists, it's a display problem, like a stale page or a filter, and I'd check the orders page. If the ledger has a deduction with no order, that's a data problem. That should be impossible, because the deduction and the order are written in the same transaction.
>
> **Then fix and prevent.** I fix the root cause, add a test that reproduces it, and run my reconciliation check. That confirms every balance equals the sum of its ledger, so drift is caught early. I would never fix a balance by editing it directly. I'd add an adjustment entry so the history stays honest."

## 6. Wrap-up (30 sec)

> "Known limitations are in the README. For example, there's no password reset, and demo requests are stored but not emailed. With more time I'd add peer-to-peer recognition, leaderboards, and email notifications.
>
> Happy to take questions."

---

**Notes**
- **Order numbers:** Maria's new order won't be #1004. The test runs used up some numbers, so read whatever number appears on screen.
- **Numbers:** if the balances on screen differ from this script (for example, after more testing), say the numbers you see. What matters is that each change is exact.
- **Decisions:** for "why did you do X?" questions, see [DECISIONS.md](DECISIONS.md).

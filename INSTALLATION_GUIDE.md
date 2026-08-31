# Challenge 360° — Installation Guide

Everything from zero to a live app with self-signup, per-user health-report
uploads, and a leaderboard. Teams are built in but hidden by default — flip
`TEAMS_ENABLED` in `src/constants/features.ts` to turn them back on. No paid
services
anywhere in this stack.

**Total time:** ~15–20 minutes.

---

## Part 1 — Database (Supabase)

### 1.1 Create the project
1. https://supabase.com → **New Project**. Name it, set a DB password (save
   it), pick a region, wait ~2 minutes.
2. **Project Settings → API** — keep this tab open, you'll need:
   - **Project URL**
   - **anon public** key
   - **service_role** key (click reveal — keep secret)

### 1.2 Run the schema
1. **SQL Editor → New query**.
2. Paste the entire contents of `supabase/schema.sql` and click **Run**.
   This creates `teams`, `profiles`, `daily_logs`, `group_workouts`,
   `charity_records`, `health_reports`, `feed_posts`, `feed_reactions`, `feed_comments`, all security rules, and seeds 3
   starter teams (edit/delete these from the Admin panel later).


### 1.3 Disable email confirmation for self-signup
1. **Authentication → Providers → Email** → switch **Confirm email** OFF.
   Self-signup must create an authenticated session immediately; no confirmation
   email is sent. Email is used for authentication communication only for
   password recovery.
2. **Authentication → URL Configuration** → set:
   - **Site URL**: your deployed URL (e.g. `https://pillar-rose.vercel.app`)
   - **Redirect URLs**: add that same URL, and `http://localhost:5173` if
     you'll test locally.

### 1.4 Create yourself and become the first Super User
1. **Authentication → Users → Add User** → your email + a password → toggle
   **Auto Confirm User** ON → Create.
2. **SQL Editor → New query**, run (with your email):
   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```
3. Done — this account sees the Admin tab and can manage teams and
   participants.

---

## Part 2 — Health report storage (already handled)

Health report screenshots now upload straight into **our own database**
(a private Supabase Storage bucket), not Google Drive — no Google Cloud
Console setup needed at all anymore. The `supabase/schema.sql` file you ran
in Part 1 already created the bucket and its access rules for you:

- Bucket: `health-reports`, private (not publicly browsable)
- Each file is stored under `{user_id}/...` so a participant's uploads are
  only ever visible to themselves and admins
- The app generates short-lived signed URLs on demand when displaying a
  thumbnail or "View" link — nothing is public by default

Nothing to configure here — this is just letting you know how it works
under the hood, since the previous version of this guide had a whole Google
Cloud Console section that's no longer relevant.

---

## Part 3 — Deploy to Vercel

### 3.1 Push the code
If your project is already connected to Vercel/GitHub (as `pillar-rose` is),
replace the files with the new ones from this zip and push as usual. If
starting fresh, push this folder to a new GitHub repo and import it into
Vercel (`vercel.com → Add New → Project`).

### 3.2 Environment variables
Vercel → your project → **Settings → Environment Variables**, add for all
environments:

| Name | Value | Exposed to browser? |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon public key | Yes |
| `SUPABASE_URL` | same Project URL | **No** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key | **No — server only** |

Redeploy after adding these (Deployments → ⋯ → Redeploy).

### 3.3 Verify
Open your live URL. You should see the login screen with a **Create an
account** link. Log in with the admin
account from 1.4 — you should land on the scorecard with **Admin** and
**Leaderboard** tabs visible.

---

## Part 4 — Set up teams and invite people

1. **Admin tab → Teams** — rename/delete the 3 seed teams or add your real
   team names.
2. Share the site URL with participants. They can:
   - **Self-signup**: fill the form, create the account, and continue directly into the app; no email confirmation is required.
   - Or you create their account directly from Admin → New Participant, same
     as before.
   - (They'll see a one-time "Welcome" prompt on first login if teams are
     enabled — see the note below.)
3. Everyone's scores now show up on the **Leaderboard** tab (individual and
   team views) automatically as they log their days.

---

## How it all fits together

- **Teams** are created only by admins; participants pick theirs at signup.
  This feature is currently hidden from users by default — flip
  `TEAMS_ENABLED` in `src/constants/features.ts` to turn it back on.
- **Community**: explicitly saving a daily check-in publishes/updates one daily activity card with achievement tags. All authenticated participants can react with emojis and add comments.
- **Leaderboard** reads only aggregate score totals (via two
  security-definer SQL functions), never raw habit data — so rankings are
  visible to everyone without exposing anyone's private hydration/sleep/etc.
  entries.
- **Health report screenshots** upload directly into our private Supabase
  Storage bucket, organized per participant so only they and admins can see
  them. Signed, time-limited URLs are generated on the fly for viewing —
  nothing is ever publicly accessible.
- **Email notifications** (signup confirmation, forgot password) are sent by
  Supabase's built-in auth email service automatically — no extra setup
  needed for a group this size. If you outgrow the default sending limits,
  Supabase → Authentication → Settings → SMTP Settings lets you plug in your
  own mail provider (e.g. a free-tier SendGrid/Resend account) later.

## Troubleshooting

| Problem | Likely cause |
|---|---|
| Health report upload fails | Check that `supabase/schema.sql` ran fully — it creates the `health-reports` storage bucket and its access policies |
| "Failed to open popup window" on upload | Browser blocked the popup — check the address bar for a blocked-popup icon and allow it for this site, then try again |
| Signup does not log the user in immediately | Confirm **Confirm email** is OFF in Supabase Authentication → Providers → Email. The application no longer uses signup confirmation emails. |
| Leaderboard shows 0 for everyone | Scores are only written going forward — logs saved before this update won't have the new score columns until edited/re-saved once |
| Admin tab / Leaderboard blank | Re-check `supabase/schema.sql` ran fully without errors (scroll up in the SQL editor output) |

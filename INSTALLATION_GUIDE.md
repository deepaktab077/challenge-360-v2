# Challenge 360° — Installation Guide

Everything from zero to a live, multi-team app with self-signup, Google
sign-in, per-user Google Drive uploads, and a leaderboard. No paid services
anywhere in this stack.

**Total time:** ~30–40 minutes (most of it is the Google Cloud step).

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
   `charity_records`, `health_reports`, all security rules, and seeds 3
   starter teams (edit/delete these from the Admin panel later).

### 1.3 Turn on email confirmation for self-signup
1. **Authentication → Providers → Email** → make sure **Confirm email** is
   switched ON (it is by default). This is what makes the "check your inbox"
   step in the signup flow actually required.
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

## Part 2 — Google Cloud (Sign-in + Drive uploads)

This single Google Cloud project/OAuth client powers **both** "Continue with
Google" login and the "upload to your own Drive" health-report feature.

### 2.1 Create the project
1. https://console.cloud.google.com → create a new project (any name).

### 2.2 Enable the Drive API
1. **APIs & Services → Library** → search **Google Drive API** → **Enable**.

### 2.3 Configure the OAuth consent screen
1. **APIs & Services → OAuth consent screen**.
2. **User Type**: choose **External** (unless everyone has a Google
   Workspace account on the same domain, in which case **Internal** is
   simpler and skips verification entirely).
3. Fill in app name (e.g. "Challenge 360"), your email, etc.
4. **Scopes** → add:
   - `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid` (sign-in)
   - `https://www.googleapis.com/auth/drive.file` (Drive upload — this scope
     only lets the app see files *it* creates, never a participant's whole
     Drive)
5. **Test users** (if External + Testing status): add every participant's
   Google email here. Apps in "Testing" mode only work for listed test users
   (up to 100) unless you complete Google's verification review — for a
   private challenge, Testing mode + a full test-user list is the practical
   choice.

### 2.4 Create the OAuth Client ID
1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. **Application type**: Web application.
3. **Authorized JavaScript origins** — add your site URL(s):
   - `https://pillar-rose.vercel.app` (your deployed URL)
   - `http://localhost:5173` (for local dev, optional)
4. **Authorized redirect URIs** — add your Supabase auth callback (needed
   only for "Continue with Google" login, not for the Drive upload):
   - `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
5. Save. Copy the **Client ID** and **Client Secret**.

### 2.5 Plug it into Supabase (enables "Continue with Google" login)
1. Supabase Dashboard → **Authentication → Providers → Google** → toggle on.
2. Paste the **Client ID** and **Client Secret** from step 2.4. Save.

### 2.6 Plug it into your app (enables Drive uploads)
You'll set `VITE_GOOGLE_CLIENT_ID` = the same Client ID in Part 3 below.

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
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID (2.4) | Yes |
| `SUPABASE_URL` | same Project URL | **No** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key | **No — server only** |

Redeploy after adding these (Deployments → ⋯ → Redeploy).

### 3.3 Verify
Open your live URL. You should see the login screen with a **Continue with
Google** button and a **Create an account** link. Log in with the admin
account from 1.4 — you should land on the scorecard with **Admin** and
**Leaderboard** tabs visible.

---

## Part 4 — Set up teams and invite people

1. **Admin tab → Teams** — rename/delete the 3 seed teams or add your real
   team names.
2. Share the site URL with participants. They can:
   - **Self-signup**: fill the form, pick their team, confirm via email, log in.
   - **Google sign-in**: one click — they'll be prompted to pick a team on
     first login (the "Welcome" modal).
   - Or you create their account directly from Admin → New Participant, same
     as before.
3. Everyone's scores now show up on the **Leaderboard** tab (individual and
   team views) automatically as they log their days.

---

## How it all fits together

- **Teams** are created only by admins; participants pick theirs at signup
  (or get prompted once if they used Google sign-in).
- **Leaderboard** reads only aggregate score totals (via two
  security-definer SQL functions), never raw habit data — so rankings are
  visible to everyone without exposing anyone's private hydration/sleep/etc.
  entries.
- **Health report screenshots** upload directly from the participant's
  browser into *their own* Google Drive (a folder called "Challenge 360 -
  Health Reports" the app creates on first use). Only a link/thumbnail
  pointer is stored in our database — the image itself never touches our
  servers.
- **Email notifications** (signup confirmation, forgot password) are sent by
  Supabase's built-in auth email service automatically — no extra setup
  needed for a group this size. If you outgrow the default sending limits,
  Supabase → Authentication → Settings → SMTP Settings lets you plug in your
  own mail provider (e.g. a free-tier SendGrid/Resend account) later.

## Troubleshooting

| Problem | Likely cause |
|---|---|
| "Google Drive isn't configured yet" | `VITE_GOOGLE_CLIENT_ID` missing in Vercel, or not redeployed |
| Google popup says "Error 403: access_denied" | Your Google account isn't in the OAuth consent screen's Test Users list (Part 2.3) |
| "Continue with Google" login fails | Client ID/Secret not saved in Supabase → Authentication → Providers → Google, or the Supabase callback URL isn't in the Google Client's Authorized redirect URIs |
| Signup confirmation email never arrives | Check spam; confirm "Confirm email" is ON in Supabase; Supabase's default sender has modest rate limits — for larger groups set up custom SMTP |
| New Google sign-in user has no team | Expected — they'll see the "Welcome to Challenge 360" modal on first login prompting them to pick one |
| Leaderboard shows 0 for everyone | Scores are only written going forward — logs saved before this update won't have the new score columns until edited/re-saved once |
| Admin tab / Leaderboard blank | Re-check `supabase/schema.sql` ran fully without errors (scroll up in the SQL editor output) |

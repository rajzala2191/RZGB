# Email delivery (auth emails)

Users receive auth-related emails for **password reset** (OTP) and **invitations** (create password). These are sent by Supabase Auth. Delivery depends on your environment.

## Local development

With `supabase start`, emails are **not** sent to real addresses. They are captured by **Inbucket**:

- Open **http://localhost:54324** (or the port in `supabase/config.toml` → `[inbucket]`).
- All password-reset and invite emails appear there.

So in local dev, "users not receiving emails" is expected unless you check Inbucket.

## Production (hosted Supabase – supabase.com)

To deliver to real user inboxes you must configure **SMTP** in the Supabase Dashboard:

1. Open your project → **Project Settings** → **Auth**.
2. Scroll to **SMTP Settings**.
3. Enable **Custom SMTP** and set (example for **Resend**):
   - **Host:** `smtp.resend.com`
   - **Port:** `465` (SSL)
   - **Username:** `resend`
   - **Password:** your Resend API key (from [Resend dashboard](https://resend.com/api-keys))
   - **Sender email** and **Sender name** (e.g. from your verified Resend domain).
   - **Minimum interval per user:** e.g. `60` seconds (rate limit per user).

Without custom SMTP, Supabase uses its default mailer, which often does not deliver reliably to user inboxes (spam, rate limits). **Configure SMTP for production so users receive password reset and invite emails.**

**Password reset:** Supabase returns *success* even when the email is not registered (to prevent enumeration). In that case **no email is sent**. The address must exist in **Auth → Users** for a recovery email to be delivered.

**"Only request this after X seconds":** Auth rate-limits the recover endpoint. If you use **Dashboard → Authentication → Users → Send password recovery**, wait at least **5 seconds** (sometimes up to 60 seconds depending on project/SMTP settings) before sending again. The same limit applies when using the app’s Forgot password flow; the app shows a short “wait and try again” message.

### Why am I not receiving the recovery email?

- **User not in Auth:** The address must exist under **Authentication → Users**. Supabase returns success but does not send an email for unknown addresses.
- **SMTP not configured:** In production, configure **Dashboard → Project Settings → Auth → SMTP** (e.g. Resend) so emails are delivered to real inboxes.
- **Rate limit:** Wait 5–60 seconds between recovery requests (per user / per IP).
- **Spam / domain:** Check spam and that your sender domain is verified in your SMTP provider (e.g. Resend).

### User is in Supabase and SMTP is correct, but still no email

If the user exists in **Auth → Users** and SMTP (e.g. Resend) is set correctly, try this:

1. **Rate limit:** Wait at least **60 seconds** since the last recovery request for that email, then try **Send Code** or **Send password recovery** once. Supabase and many SMTP providers enforce a per-user minimum interval.
2. **Spam / junk:** Check the recipient’s **spam and junk** folder and any “safe senders” / filtering rules.
3. **Recovery template (hosted Supabase):** In **Dashboard → Authentication → Email Templates**, open the **Reset password** (recovery) template. Ensure the body includes **`{{ .Token }}`** so the 6-digit code is sent. If it only has a link or is empty, the app’s “enter code” step won’t get a code; fix or replace the template (you can use the content from `supabase/email-templates/recovery.html` in the repo).
4. **Resend (or your provider):** In the Resend dashboard, open **Logs** or **Emails**. Trigger **Send Code** again and see whether a new send appears and its status (e.g. delivered, bounced, deferred). If nothing appears, Supabase may not be calling SMTP (e.g. template error or Auth error).
5. **Supabase Auth logs:** In **Dashboard → Logs → Auth**, look for errors around the time you requested recovery (e.g. template render failure, SMTP error).

### Alternative: admin set password (no email)

When recovery emails are not arriving, an **admin** can set a temporary password for a user from the app:

1. Log in as an admin → **Control Centre → User Management**.
2. Open the user (e.g. **admin@rzglobalsolutions.co.uk**) in the detail drawer.
3. Click **Set password**, enter a new password (min 8 characters) and confirm, then submit.
4. Share the new password with the user securely (e.g. in person or over a secure channel). They can log in and change it later from **Settings** if needed.

This uses the **admin-set-password** Edge Function (admin-only) and does not send any email.

### Only admin locked out (e.g. admin@rzglobalsolutions.co.uk)

If the **only** admin cannot receive the recovery email and cannot log in, they cannot use “Set password” in the app (that requires being logged in as an admin). Use this workaround:

1. **Open Supabase Dashboard** (as project owner) → **Authentication** → **Users**.
2. **Invite a second user** (e.g. a colleague or your personal email): use **Invite user**, enter the email, send. That user will get an invite email to set their password.
3. **Make the new user an admin:** go to **Table Editor** → **profiles** → find the new user (match by the new user’s `id` from Auth → Users, or by email if `profiles` has it). Set that row’s **role** to **admin**.
4. **Log in as the new admin** (they set their password from the invite email, then sign in to the portal).
5. In the app go to **Control Centre** → **User Management** → open the original admin (e.g. admin@rzglobalsolutions.co.uk) → **Set password** and set a new password.
6. Share the new password with the original admin securely. They can log in again and change it in **Settings** if needed.
7. Optionally deactivate or remove the temporary second admin from **User Management** if you no longer need them.

After that, fix recovery email (SMTP, spam, rate limit) so the main admin can use “Forgot password” next time.

## Self-hosted Supabase

In `supabase/config.toml`, the `[auth.email.smtp]` block is commented out. To send real emails:

1. In `supabase/config.toml`, set `[auth.email.smtp]` → `enabled = true`.
2. Set `admin_email` to your real sender address (e.g. `noreply@yourdomain.com`) and keep or adjust `sender_name`.
3. Set the SMTP host, port, user, and pass (e.g. `pass = "env(SENDGRID_API_KEY)"`) and ensure that env var is set where Auth runs.
4. Restart Supabase Auth so the config is loaded.

The rate limit `auth.rate_limit.email_sent` (e.g. 30 per hour) applies when SMTP is enabled.

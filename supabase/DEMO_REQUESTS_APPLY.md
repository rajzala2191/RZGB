# Fix: "Could not find the table 'public.demo_requests'"

**Do not run this .md file in SQL Editor.** This is a Markdown readme.

Run the **SQL file** instead: **supabase/migrations/20260315000000_demo_requests.sql**

---

The `demo_requests` table is created by that migration. Apply it once to your Supabase database.

## Option 1: Supabase Dashboard (SQL Editor)

1. Open your project in [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**.
2. Open the file **supabase/migrations/20260315000000_demo_requests.sql** (the .sql file, not this .md file).
3. Copy **all** of its contents (only SQL, no markdown).
4. Paste into a new query in the SQL Editor and click **Run**.

## Option 2: Supabase CLI

From the project root: `npx supabase db push` (after `supabase link`).

---

**Note:** The migration uses `is_super_admin()` from `20260314000000_workspace_tenancy.sql`. If you get "function is_super_admin() does not exist", run that migration first.

---

## Demo approval email (Resend)

When you **Approve & send link**, the `approve-demo-request` Edge Function sends the demo link by email via [Resend](https://resend.com). If the requester does not receive the email:

1. **Set Edge Function secrets** in Supabase Dashboard:
   - **Project** → **Edge Functions** → **approve-demo-request** → **Secrets** (or **Settings**).
   - Add:
     - `RESEND_API_KEY` — your [Resend API key](https://resend.com/api-keys).
     - (Optional) `RESEND_FROM` — sender address, e.g. `RZ Global Solutions <noreply@yourdomain.com>`. Default is `Zaproc <noreply@zaproc.co.uk>`.
2. In Resend, **verify the sending domain** for the address you use in `RESEND_FROM`.
3. Redeploy the function after changing secrets:  
   `npx supabase functions deploy approve-demo-request`

If the key is missing, the UI will show **Approved (email not sent)** with the reason after you approve a request.

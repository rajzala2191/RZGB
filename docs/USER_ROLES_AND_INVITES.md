# User roles and inviting users

## Where roles are stored

Roles are **not** in Supabase Auth — they live in your **`profiles`** table in the database.

- **Table:** `profiles`
- **Column:** `role` — one of `client`, `supplier`, `admin`
- **Other useful columns:** `id` (same as Auth user id), `email`, `company_name`, `status`, `created_at`

## How to see user roles in Supabase

1. **Dashboard → Table Editor**
   - Open your project → **Table Editor** → select the **`profiles`** table.
   - You’ll see each user’s `role` (and `email`, `company_name`, etc.).

2. **SQL Editor**
   - **Dashboard → SQL Editor** → New query.
   - Run:
   ```sql
   SELECT id, email, role, company_name, status, created_at
   FROM profiles
   ORDER BY created_at DESC;
   ```
   - If `profiles` doesn’t have `email`, join with Auth:
   ```sql
   SELECT p.id, u.email, p.role, p.company_name, p.status
   FROM profiles p
   LEFT JOIN auth.users u ON u.id = p.id
   ORDER BY p.created_at DESC;
   ```

## How to send an invite with a specific role

Invites are handled by the **`invite-user`** Edge Function. It creates the user in Auth, sends the invite email, and sets **`role`** (and `company_name`) in **`profiles`**.

### Option 1: From the app (recommended)

1. Log in as an **admin**.
2. Go to **Control Centre → User Management** (or the page where “Invite user” is available).
3. Open **Invite user** / **Invite New User**.
4. Enter **email**, **company name**, and choose **role**: **Client**, **Supplier**, or **Admin**.
5. Send the invitation. The user receives an email to set their password and is created with the chosen role.

### Option 2: Call the Edge Function (API)

To invite with a specific role from another system or a script:

- **Endpoint:** `POST https://<project-ref>.supabase.co/functions/v1/invite-user`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <SUPABASE_ANON_KEY>` (or service role if you need to bypass RLS; the function uses the service role internally)
- **Body:**
  ```json
  {
    "email": "newuser@example.com",
    "company_name": "Acme Ltd",
    "role": "client"
  }
  ```
- **Allowed `role` values:** `client`, `supplier`, `admin`

Example with curl (replace project ref and key):

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/invite-user' \
  -H 'Authorization: Bearer YOUR_ANON_OR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"email":"newuser@example.com","company_name":"Acme Ltd","role":"supplier"}'
```

**Note:** Inviting from **Supabase Dashboard → Authentication → Users → Invite user** creates the Auth user and sends the invite email but does **not** set `profiles.role` or `company_name`. For role-based invites, use the app or the `invite-user` function above.

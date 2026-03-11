# Superadmin (Platform Owner) — Implementation Plan

**Goal:** Add a role above `admin` so you can sell **admin** to businesses while retaining full platform control.

---

## 1. Database

| Task | Details |
|------|--------|
| **Add role value** | Add `superadmin` to the `profiles.role` type. If you use a Postgres enum (`user_role`), run `ALTER TYPE user_role ADD VALUE 'superadmin';` in a new migration. If `role` is plain TEXT, no schema change needed. |
| **RLS: orders** | Keep existing admin policies (demo-isolated). Add policies for **superadmin**: `SELECT` and `UPDATE` on `orders` with no demo filter so superadmin sees **all** orders. |
| **RLS: profiles** | Keep existing admin policy (demo-isolated). Add policy for **superadmin**: `SELECT` on `profiles` with no demo filter so superadmin sees **all** users. |
| **RLS: manufacturing_processes** | Change admin-only policy to allow **admin OR superadmin** (e.g. `auth_user_role() IN ('admin','superadmin')`). |
| **Helper (optional)** | You can add `auth_user_is_platform_admin() -> (role IN ('admin','superadmin'))` and use it where “admin-level” access is needed. |

---

## 2. Edge Functions

| Function | Change |
|----------|--------|
| **admin-set-password** | Allow callers whose `profile.role` is `admin` **or** `superadmin` (currently only `admin`). |
| **invite-user** | **Do not** allow inviting with `role: 'superadmin'` from the app (reject in the function). Superadmins are created manually (e.g. SQL or Dashboard) so only you control them. |

---

## 3. App — Access Control

| Place | Change |
|------|--------|
| **ProtectedRoute** | When `requiredRole === 'admin'`, grant access if `userRole === 'admin' || userRole === 'superadmin'` so superadmins can use all control-centre routes. |
| **RootRedirect** | Redirect `userRole === 'superadmin'` to `/control-centre` (same as admin). |
| **LoginContainer** | After login, redirect superadmin to `/control-centre` like admin. |
| **AdminContext** | Set `isAdmin = (userRole === 'admin' || userRole === 'superadmin')` so dashboard and admin features work for both. |

No new routes or layouts are required; superadmin uses the same Control Centre as admin but with “see everything” enforced by RLS.

---

## 4. App — Notifications & Queries

Where the app fetches “admins” to notify or display, include superadmins so platform owners get the same alerts:

| File / behaviour | Change |
|------------------|--------|
| **submitOrderToAdmin.js** | When loading admins to notify (e.g. new order submitted), query `role` in `('admin','superadmin')` (e.g. `.in('role', ['admin','superadmin'])` or equivalent). |
| **ClientSupportPage / SupplierSupportPage** | When resolving “admins” for support ticket notifications, include superadmin. |
| **MilestoneUpdater.jsx** | When notifying admins of milestone updates, include superadmin. |
| **TicketDetailPage.jsx** | Same as above if it fetches admins. |

---

## 5. App — UI (optional)

| Item | Suggestion |
|------|------------|
| **Control Centre / User Management** | Optionally show a badge like “Platform” or “Superadmin” next to superadmin users so you can tell them apart from business admins. |
| **Invite modal** | Keep role options as **Client / Supplier / Admin** only. Do not expose “Superadmin” in the invite UI. |
| **User edit (e.g. UserDetailDrawer)** | Do not allow changing a user’s role to or from `superadmin` in the app; reserve that for SQL/Dashboard or a future superadmin-only screen. |

---

## 6. Creating Your First Superadmin

- **Option A:** In Supabase Dashboard → Table Editor → `profiles`, find your user row and set `role` to `superadmin`.  
- **Option B:** Run in SQL Editor:  
  `UPDATE profiles SET role = 'superadmin' WHERE id = '<your-auth-user-id>';`  
  (If you use an enum, ensure `superadmin` has been added to the type first.)

---

## 7. Docs

- Update **USER_ROLES_AND_INVITES.md**: state that roles are `client`, `supplier`, `admin`, and `superadmin`; that `superadmin` is platform-owner only and not inviteable from the app; and that only superadmins see all tenants/data (no demo/tenant isolation).

---

## Summary

| Layer | Superadmin behaviour |
|-------|------------------------|
| **DB RLS** | Sees all orders and all profiles; same admin-level write on manufacturing_processes. |
| **Edge Functions** | Can call admin-set-password; cannot be created via invite-user. |
| **App** | Uses Control Centre like admin; gets all admin notifications; not offered in invite or role dropdown. |

This gives you a single “god-mode” tier without changing the productised admin experience for customers.

# Admin Console Implementation Notes

## Implemented Scope

The admin use-case foundation is implemented as a protected `/admin` route group.

Current pages:

- `/admin` - operations overview
- `/admin/data-sources` - live source health
- `/admin/shelters` - shelter monitoring
- `/admin/alerts` - stored weather alert view
- `/admin/simulation` - simulation scenario status
- `/admin/users` - profile monitoring and protected regular-user deletion

This follows the admin use-case diagram in `/temp`, focusing first on operational monitoring and data-system control.

## Access Control

Admin access is handled in:

```txt
lib/admin/auth.ts
app/admin/layout.tsx
```

The check supports two admin sources:

1. `profiles.role = 'admin'`
2. `ADMIN_EMAILS` environment variable fallback

`ADMIN_EMAILS` is useful while the database migration is not yet applied. Example:

```txt
ADMIN_EMAILS=admin@example.com,second-admin@example.com
```

If the user is not signed in, `/admin` redirects to `/login`. If the user is signed in but not admin, the route shows a clear forbidden page instead of rendering admin data.

## Migrations Added

```txt
supabase/migrations/008_admin_roles.sql
```

Adds:

```sql
profiles.role TEXT NOT NULL DEFAULT 'user'
```

with a check constraint:

```txt
user | admin
```

```txt
supabase/migrations/012_admin_profile_management.sql
```

Migration 012 repairs environments where earlier profile migrations were not
applied consistently. It:

```txt
adds phone_number and phone_verified when missing
adds and validates profiles.role when missing
migrates legacy is_admin = true records to role = admin
adds a non-recursive is_admin() database helper
allows authenticated admins to read all profiles through RLS
```

The user-management page remains read-only. Migration 012 does not give admins
permission to edit another user's profile or role.

## Components Added

```txt
components/admin/AdminShell.tsx
components/admin/AdminNav.tsx
components/admin/AdminPageHeader.tsx
components/admin/AdminStatusPill.tsx
components/admin/AdminEmptyState.tsx
components/admin/AdminForbidden.tsx
```

These keep admin pages consistent and lightweight.

## Data Flow

Admin monitoring pages use the existing provider layer:

```txt
getEmergencyData({ mode: "live" })
```

That keeps admin views aligned with the same live/simulation model used by test UI pages.

The sync button reuses:

```txt
components/DataSyncButton.tsx
app/actions/sync.ts
```

So admin refresh does not duplicate the external API sync implementation.

## Page Responsibilities

### `/admin`

Shows:

- shelter count
- online shelter count
- weather alert count
- degraded data source count
- recent alert snapshot
- source health summary

### `/admin/data-sources`

Shows each data source:

- name
- source type
- status
- notes
- last checked time

### `/admin/shelters`

Shows:

- total shelters
- online shelters
- high-capacity shelters
- shelter cards with victims, families, capacity, and online/offline status

For mobile performance, it renders only the first 120 shelter records and displays a note if more records exist.

### `/admin/alerts`

Shows stored weather alerts from the live provider:

- title
- source
- severity
- affected area
- issued time
- valid-until time

### `/admin/simulation`

Shows simulation scenario status and record counts.

Simulation import is not implemented yet. The page documents the next direction: import selected scenario records into normalized simulation tables.

### `/admin/users`

It reads profiles and displays:

- full name
- profile id
- phone number
- role

If the profile schema or RLS policy is unavailable, the page identifies
migration 012 as the required repair.

Admins can permanently remove regular users. The deletion workflow:

```txt
requires authenticated admin access
rejects invalid user IDs
prevents self-deletion
prevents deletion of another admin account
requires a confirmation dialog
deletes the Supabase Auth identity through the server-only admin API
relies on ON DELETE CASCADE foreign keys for user-owned records
revalidates the user-management page
```

The following server-only environment variable is required:

```txt
SUPABASE_SERVICE_ROLE_KEY=<Supabase project service-role key>
```

Never prefix this variable with `NEXT_PUBLIC_` and never expose it to browser
components. It bypasses Row-Level Security and must only be available to the
trusted Next.js server environment.

Deleting only a row from `profiles` is intentionally not supported because the
person would retain their Supabase Auth account and could continue signing in.

## Best Practices Used

- Admin route protection happens at layout level.
- Admin pages reuse the shared data provider instead of calling external APIs directly.
- Sync actions are reused instead of duplicated.
- Mobile-heavy pages cap large lists for performance.
- User deletion uses the server-only Supabase Auth admin API.
- Admin and self-deletion are blocked from the user-management page.
- Components are small and reusable.

## Next Steps

1. Apply migrations through `012_admin_profile_management.sql` in Supabase.
2. Set at least one admin either by:
   - updating `profiles.role = 'admin'`, or
   - adding `ADMIN_EMAILS` in `.env.local`
3. Ensure an `ADMIN_EMAILS` fallback account also has `profiles.role = 'admin'`
   before expecting database RLS to allow the user-management list.
4. Configure `SUPABASE_SERVICE_ROLE_KEY` in the trusted server environment to
   enable permanent regular-user deletion.
5. Add role editing only after a separate audited admin-write policy is designed.
6. Add simulation import tables and import action.
7. Add historical views for shelter snapshots and alert timelines.

### Applying Migration 012

Run the contents of:

```txt
supabase/migrations/012_admin_profile_management.sql
```

in the Supabase SQL Editor or through the project's migration deployment
workflow. Then assign an admin role when no legacy `is_admin` assignment exists:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = '<authenticated-user-uuid>';
```

Rollback removes only the admin read policy and helper:

```txt
supabase/rollback/012_admin_profile_management.sql
```

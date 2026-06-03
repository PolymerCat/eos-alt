# Admin Console Implementation Notes

## Implemented Scope

The admin use-case foundation is implemented as a protected `/admin` route group.

Current pages:

- `/admin` - operations overview
- `/admin/data-sources` - live source health
- `/admin/shelters` - shelter monitoring
- `/admin/alerts` - stored weather alert view
- `/admin/simulation` - simulation scenario status
- `/admin/users` - read-only profile monitoring

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

## Migration Added

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

Currently read-only.

It attempts to read profiles and displays:

- full name
- profile id
- phone number
- role

If Supabase RLS blocks profile reads, the page explains that admin RLS policies are needed before full user management is enabled.

## Best Practices Used

- Admin route protection happens at layout level.
- Admin pages reuse the shared data provider instead of calling external APIs directly.
- Sync actions are reused instead of duplicated.
- Mobile-heavy pages cap large lists for performance.
- User management is read-only until role/RLS policy is hardened.
- Components are small and reusable.

## Next Steps

1. Apply `008_admin_roles.sql` in Supabase.
2. Set at least one admin either by:
   - updating `profiles.role = 'admin'`, or
   - adding `ADMIN_EMAILS` in `.env.local`
3. Add admin RLS policies for reading profiles.
4. Add role editing after RLS is confirmed.
5. Add simulation import tables and import action.
6. Add historical views for shelter snapshots and alert timelines.

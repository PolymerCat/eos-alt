# SOS Emergency Contacts Implementation

Date: 2026-06-02

## Purpose

Emergency contacts are the recipients used by the SOS flow. The SOS page now lets the user manage contacts and immediately use the selected contact in the WhatsApp deep-link SOS flow.

## Files

### `app/sos/actions.ts`

Server-side boundary for SOS persistence and contact management.

Implemented actions:

- `submitSosRequest`
- `createEmergencyContact`
- `updateEmergencyContact`
- `deleteEmergencyContact`
- `setPrimaryEmergencyContact`

Best-practice notes:

- Database writes stay in server actions, not client components.
- User ownership is checked through Supabase auth.
- Contact inputs are normalized before writing.
- Contact inputs are validated before database writes.
- When a contact becomes primary, other contacts are demoted so only one primary contact is selected.
- `revalidatePath("/test-ui/sos")` keeps server-rendered SOS data fresh after mutations.

### `components/sos/SosWorkspace.tsx`

Client-side coordinator for the SOS page.

Responsibilities:

- Stores the current contact list in state.
- Renders `SosAlertFlow`.
- Renders the contact form and contact list.
- Keeps the SOS contact picker in sync after add, edit, delete, and primary changes.
- Uses local-only contact mutations in simulation mode so simulation does not write to live tables.

### `components/sos/SosAlertFlow.tsx`

Client-side SOS interaction flow.

Responsibilities:

- Gets current browser location.
- Builds the SOS message preview.
- Requires hold-to-confirm.
- Saves live SOS records through `submitSosRequest`.
- Opens WhatsApp deep link with the final message.
- Avoids live database writes in simulation mode.

### `app/test-ui/sos/page.tsx`

Server-rendered page that loads the current emergency snapshot and passes contacts/request data into `SosWorkspace`.

## Data Expectations

The `emergency_contacts` table should support:

```txt
id
user_id
name
role
phone_number
delivery_method
is_primary
created_at
updated_at
```

The app currently expects the contact shape:

```ts
interface EmergencyContact {
  id: string;
  name: string;
  role: string;
  phoneNumber: string;
  deliveryMethod: "App Notification" | "SMS" | "Email";
  isPrimary: boolean;
}
```

## Current Limitation

The current SOS delivery uses WhatsApp deep links. This means the app can prepare the message and open WhatsApp, but the user still presses Send inside WhatsApp.

Automated sending should be added later through SMS or WhatsApp Business API.

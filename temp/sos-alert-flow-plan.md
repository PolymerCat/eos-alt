# SOS Alert Flow Plan

Date: 2026-06-02

## Proposed User Flow

1. User clicks the SOS button.
2. System requests the user's current location through browser geolocation.
3. System shows a preview screen before sending:
   - alert message
   - latitude and longitude
   - Google Maps link
   - selected emergency contact
   - delivery method
4. User holds the confirm button to prevent accidental sends.
5. System saves the SOS request to the database.
6. System sends the SOS message through the selected channel.
7. System updates the request status based on the delivery result.

## Recommended Message Format

```txt
SOS ALERT

{userName} needs emergency assistance.

Message:
{customMessage}

Location:
Latitude: {latitude}
Longitude: {longitude}
Map: https://www.google.com/maps?q={latitude},{longitude}

Sent from Emergency OS at {timestamp}.
```

The map link is important because the recipient can open it immediately without interpreting raw coordinates.

## WhatsApp vs SMS

### WhatsApp

Advantages:
- Familiar to Malaysian users.
- Supports rich messages and map links nicely.
- Uses internet data instead of normal SMS credit for the sender/recipient.
- Good for family contacts because most people already check WhatsApp often.

Limitations:
- A true automatic send needs WhatsApp Business Platform / Cloud API or a provider such as Twilio.
- Business-initiated WhatsApp messages usually require approved templates and platform rules.
- Recipient must have WhatsApp and internet access.
- If using a simple `wa.me` link, the app can only open WhatsApp with a prefilled message. The user still has to press Send manually.

### SMS

Advantages:
- Easier to automate with providers such as Twilio Programmable Messaging.
- Does not require the recipient to have WhatsApp.
- More reliable when the recipient has weak internet but still has cellular service.
- Better fallback channel for emergencies.

Limitations:
- Usually costs money per message to the app owner/provider account.
- Message length matters; long messages can be split into multiple SMS segments.
- Less rich than WhatsApp.

## Opinion

For an SOS feature, SMS is technically easier and more reliable for automated delivery. WhatsApp is more convenient for users, but programmatic WhatsApp sending has more onboarding and policy friction.

Best practical approach:

1. Start with database-backed SOS records.
2. Add WhatsApp deep link for prototype/demo:
   - easiest implementation
   - no backend provider needed
   - user manually presses Send in WhatsApp
3. Add Twilio SMS for real automatic delivery:
   - backend sends SMS after hold confirmation
   - request status can be updated reliably
4. Later add WhatsApp Business API as an optional channel.
5. Long-term production behavior should support both:
   - WhatsApp first if configured and recipient opted in
   - SMS fallback if WhatsApp fails or is unavailable

## Implementation Phases

### Phase 1: Local SOS Flow

Goal: make the feature feel complete without external message delivery.

Build:
- SOS button
- geolocation request
- preview screen
- hold-to-confirm interaction
- database insert into `sos_requests`
- status display

Suggested status sequence:

```txt
draft -> submitted -> sent
```

If geolocation fails:

```txt
draft -> submitted_with_manual_location
```

The current `SosStatus` type does not include `submitted_with_manual_location`, so either avoid that extra status or extend the type later.

### Phase 2: WhatsApp Prototype

Use a generated WhatsApp URL:

```txt
https://wa.me/{phoneNumber}?text={encodedMessage}
```

Behavior:
- after hold confirmation, save SOS request as `submitted`
- open WhatsApp with the prefilled message
- show app status as `submitted`
- optionally ask user to mark as sent after WhatsApp opens

Important limitation:
- this does not guarantee the message was sent because WhatsApp requires the user to press Send.

### Phase 3: SMS Automated Delivery

Use a backend server action or route handler:

```txt
submitSosRequest()
-> insert sos_requests row with status submitted
-> call SMS provider
-> update row to sent or failed
```

Do not call Twilio or any messaging API directly from a client component. API credentials must stay server-side.

### Phase 4: WhatsApp Business API

Only add this after the core SOS flow is stable.

Requirements:
- WhatsApp Business Platform setup
- business phone number or provider sender
- approved message templates if needed
- recipient opt-in strategy
- webhook/status callback handling

## Suggested Code Structure

```txt
app/sos/actions.ts
components/sos/SosButton.tsx
components/sos/SosPreview.tsx
components/sos/EmergencyContactPicker.tsx
components/sos/SosRequestStatus.tsx
components/sos/SosHistoryList.tsx
```

## Server Actions To Build

```ts
getEmergencyContacts()
createEmergencyContact()
updateEmergencyContact()
deleteEmergencyContact()
submitSosRequest()
cancelSosRequest()
markSosRequestSent()
markSosRequestFailed()
```

## Database Notes

Current app types expect:

```ts
interface SosRequest {
  id: string;
  userId: string;
  latitude?: number;
  longitude?: number;
  message: string;
  status: "draft" | "submitted" | "sent" | "failed" | "cancelled";
  contactId?: string;
  createdAt: string;
}
```

Recommended `sos_requests` fields:

```txt
id
user_id
latitude
longitude
message
status
contact_id
delivery_method
provider_message_id
delivery_error
created_at
updated_at
sent_at
```

Recommended `emergency_contacts` fields:

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

## Safety Requirements

- Use hold-to-confirm, not single-click send.
- Show preview before sending.
- Show exact location and map link.
- Allow cancellation before confirmation.
- Handle geolocation failure gracefully.
- Save the SOS record before attempting external delivery.
- Never expose provider credentials in client code.
- Keep simulation mode separate from real SOS sending.

## Source Notes

- Twilio Messages API supports creating outbound messages and tracks statuses such as queued, sent, delivered, failed, and undelivered: https://www.twilio.com/docs/messaging/api/message-resource
- Twilio WhatsApp uses the Twilio Programmable Messaging API path for WhatsApp sending: https://www.twilio.com/docs/whatsapp/quickstart
- Meta WhatsApp Cloud API is the official WhatsApp Business Platform API, but it requires business/API setup: https://developers.facebook.com/docs/whatsapp/cloud-api/

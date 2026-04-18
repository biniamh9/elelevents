# Google Workspace / Gmail inbound reply wiring

The app accepts inbound reply payloads at:

- `POST /api/webhooks/email-replies`

Use this to surface customer replies in:

- CRM lead timelines
- admin notifications
- quote response history

## Required environment variables

- `EMAIL_INBOUND_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SITE_URL`

## Recommended payload

Post JSON like:

```json
{
  "fromEmail": "client@example.com",
  "toEmail": "info@elelevents.com",
  "subject": "Re: Your Event Quote - Wedding with Elel Events",
  "textBody": "Can you remove the cake table and resend the quote?",
  "htmlBody": "<p>Can you remove the cake table and resend the quote?</p>",
  "gmailThreadId": "thread-123",
  "gmailMessageId": "msg-456",
  "inReplyTo": "msg-previous-outbound",
  "references": ["msg-previous-outbound"],
  "provider": "google-workspace",
  "receivedAt": "2026-04-17T10:15:00.000Z"
}
```

## Matching order

Inbound replies are matched in this order:

1. existing outbound/inbound email interaction by `thread_id`
2. existing outbound/inbound email interaction by `message_id` / `inReplyTo` / `references`
3. fallback to latest inquiry by sender email

This gives exact thread history when outbound quote emails were sent by the app and recorded into `customer_interactions`.

## Gmail Apps Script bridge

If the mailbox is hosted in Google Workspace, the practical bridge is:

1. read new mailbox replies
2. extract:
   - from
   - to
   - subject
   - plain body
   - html body if available
   - Gmail thread id
   - Gmail message id
   - reply headers if available
3. POST them to `/api/webhooks/email-replies`
4. include `x-webhook-secret`
5. mark them processed in Gmail

## Production TODOs

- track processed Gmail message ids to prevent duplicate ingestion
- optionally sync full thread history, not only new replies
- optionally replace Apps Script with a dedicated inbound mailbox worker

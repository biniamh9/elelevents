# DocuSign Setup

This app can now send contracts through DocuSign directly.

## Required environment variables

Add these to `.env.local`:

```env
DOCUSIGN_AUTH_SERVER=account-d.docusign.com
DOCUSIGN_INTEGRATION_KEY=your_docusign_integration_key
DOCUSIGN_USER_ID=the_api_user_guid_for_jwt_impersonation
DOCUSIGN_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
DOCUSIGN_ACCOUNT_ID=optional_specific_account_id
DOCUSIGN_CONNECT_WEBHOOK_URL=https://your-public-domain-or-tunnel/api/webhooks/docusign
DOCUSIGN_CONNECT_KEY=optional_shared_secret_for_hmac_verification
```

## What each value is

- `DOCUSIGN_AUTH_SERVER`: use `account-d.docusign.com` for the DocuSign demo environment. Use `account.docusign.com` for production.
- `DOCUSIGN_INTEGRATION_KEY`: your DocuSign app's integration key.
- `DOCUSIGN_USER_ID`: the DocuSign user GUID that granted consent for JWT impersonation.
- `DOCUSIGN_PRIVATE_KEY`: the RSA private key from your DocuSign integration.
- `DOCUSIGN_ACCOUNT_ID`: optional. If omitted, the app uses the default account returned by DocuSign userinfo.
- `DOCUSIGN_CONNECT_WEBHOOK_URL`: public URL DocuSign can reach for signed-status callbacks.
- `DOCUSIGN_CONNECT_KEY`: optional Connect HMAC secret used to verify webhook signatures.

## First-time JWT consent

Before JWT auth works, the DocuSign user must grant consent to the integration. If JWT auth fails even with the right key and user ID, consent is usually the missing step.

## Database migration

Run this SQL:

```sql
alter table contracts
add column if not exists docusign_envelope_id text;

alter table contracts
add column if not exists docusign_envelope_status text;
```

## Current behavior

- If DocuSign is configured, clicking `Send Contract` creates and sends a DocuSign envelope directly.
- If DocuSign is not configured, the app falls back to the manual signing link field.
- Use `Sync DocuSign Status` in the contract screen to pull the latest envelope state back into the CRM.
- If `DOCUSIGN_CONNECT_WEBHOOK_URL` is configured and reachable, signed contracts update automatically and trigger an email notification to `NOTIFICATION_TO_EMAIL`.

## Webhook note for local development

DocuSign cannot post webhooks to `http://localhost:3000`. For automatic signed-status updates during local development, use a public tunnel such as ngrok or Cloudflare Tunnel and set:

```env
DOCUSIGN_CONNECT_WEBHOOK_URL=https://your-public-tunnel-url/api/webhooks/docusign
```

## Current limitation

This integration generates the contract document from the CRM's structured contract data and sends that document to DocuSign. It does not yet use a DocuSign server template.

# Elel Events Corrected Styled ZIP

This package includes a cleaned-up working starter with:

- Home page
- Styled quote request page
- Gallery page
- Packages page
- Admin inquiries page
- Supabase insert route
- Optional Resend email notification
- Optional DocuSign contract sending

## Setup

1. Install packages

```bash
npm install
```

2. Copy environment variables

```bash
cp .env.example .env.local
```

3. Add your real keys to `.env.local`

4. Run the SQL in `supabase.sql` inside Supabase SQL Editor

5. Start dev server

```bash
npm run dev
```

## Routes

- `/`
- `/request`
- `/gallery`
- `/packages`
- `/admin/inquiries`

## Notes

- Email notifications are optional. If `RESEND_API_KEY` is missing, inserts still work.
- After earlier screenshots, rotate any exposed secret keys.

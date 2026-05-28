# Codex Prompt

Build and maintain a professional internal bulk email verification dashboard inspired by the workflow of NeverBounce, without copying its branding, logo, or exact UI.

Use a clean white SaaS dashboard style with dark navy text, blue primary actions, rounded cards, good spacing, and a sidebar containing Home, Lists, Verify, and API Settings. Do not add pricing, credits, billing, subscriptions, user plan features, Talk to Sales, lookalike audiences, or third-party integrations.

Core flow:

1. Home shows the heading "Smarter Email Verification Starts Here".
2. Home has tabs for "Verify List" and "Verify Manually".
3. Verify List has a large drag-and-drop CSV/XLSX upload box, a Browse file button, and the instruction text "Upload Excel or CSV file with emails in a single column".
4. After successful upload, redirect automatically to `/lists`.
5. Lists shows newest uploaded validation jobs first and auto-refreshes every 5 seconds while jobs are waiting or processing.
6. Completed jobs show a "Download cleaned CSV" button.

Backend:

Use Node.js + Express with PostgreSQL. Store jobs in `validation_jobs` and results in `validation_results`. Process uploads in a background queue. Extract emails automatically, remove blank rows, detect duplicates, validate unique emails one by one through Reacher, use a configurable delay, save every result, update counts, mark jobs complete or failed, and expose cleaned CSV downloads.

Reacher API:

Use backend-only environment variables. Never expose the API key in the frontend.

```env
REACHER_API_URL=https://your-reacher-api-domain.com
REACHER_API_KEY=ADD_API_KEY_LATER
VALIDATION_DELAY_MS=500
```

Call:

```http
POST {REACHER_API_URL}/v0/check_email
```

Body:

```json
{
  "to_email": "test@example.com"
}
```

If `REACHER_API_KEY` exists, send `Authorization: Bearer ${REACHER_API_KEY}`.

CSV output columns:

```text
original_email, normalized_email, status, is_reachable, syntax_valid, domain,
mx_accepts_mail, is_disposable, is_role_account, is_catch_all, reason, checked_at
```

Deployment:

Prepare GitHub-ready files, `.gitignore`, `.env.example`, README setup notes, and Netlify frontend deployment. Deploy only the frontend to Netlify with `VITE_API_BASE_URL=https://your-backend-api-domain.com`. Host the Express backend, PostgreSQL database, and self-hosted Reacher API on a VPS.

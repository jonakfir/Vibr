# Supabase

SQL migrations live in `migrations/`. Apply with the Supabase CLI:

```bash
supabase link --project-ref <your-ref>
supabase db push
```

## Required environment variables

Add to `apps/web/.env.local` and to your Vercel project:

```env
# Existing
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# New — service role is used by the Stripe webhook ingest only.
# NEVER expose to the browser. Server routes only.
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# 32-byte master key for integration secret encryption (AES-256-GCM).
# Generate once and treat like a database password:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
DASHBOARD_SECRET_KEY=base64-32-bytes
```

## Stripe webhook endpoint

Point your Stripe webhook to:

```
POST https://vibr-ai.com/api/stripe/webhook
```

Add a header `X-Vibr-Company: <company_id>` on the Stripe endpoint config (via
Stripe Connect or per-company dashboards). The handler looks up the
company's stored `whsec_…` in `company_integrations` and verifies the
signature before inserting rows into `company_revenue`.

## Migration: `20260422000000_company_dashboard.sql`

Creates the multi-tenant dashboard schema:

- `companies`, `company_members`, `company_integrations`
- `company_contacts`, `company_deals`, `company_expenses`, `company_revenue`
- `company_content`, `company_audit_log`
- RLS + helper functions `is_company_member`, `has_company_role`
- Auto-attaches the creator as the `owner` via trigger
- `lookup_user_by_email` RPC for the invite flow

# Post-Launch Company Dashboard — PRD

## Goal
After Vibr ships a user's product + marketer outreach, give them a single place to run the new company: revenue, expenses, CRM, team, content, integrations.

## Current state
- `apps/web/src/app/dashboard/layout.tsx` exists (auth nav + sign-out).
- **No `page.tsx`** — `/dashboard` itself is a 404 right now (same bug class as `/find-marketers` was).
- Supabase auth wired. No workspace/company tables yet.

## Information architecture
```
/dashboard                        → overview (KPIs, activity)
/dashboard/integrations           → Stripe, Resend, Supabase, Google, custom keys
/dashboard/finance                → money in (Stripe payouts) + money out (expenses)
/dashboard/crm                    → contacts, deals, outreach log
/dashboard/team                   → employees, roles, invites
/dashboard/content                → drafts, scheduled, published (ties to existing MCC idea)
/dashboard/settings               → company profile, billing, danger zone
```

## Data model (Supabase, tenant = `company_id`)
- `companies` — id, owner_user_id, name, slug, created_at
- `company_members` — company_id, user_id, role (`owner`|`admin`|`manager`|`member`|`viewer`), invited_at, accepted_at
- `company_integrations` — company_id, provider, encrypted_keys (jsonb), status, last_sync_at
- `company_contacts` — company_id, name, email, source, stage, notes
- `company_deals` — company_id, contact_id, amount, stage, close_date
- `company_expenses` — company_id, amount, category, vendor, date, receipt_url
- `company_content` — company_id, platform, status, body, scheduled_for, published_at
- `audit_log` — company_id, user_id, action, payload, ts

All queries filtered by `company_id` via RLS + server helpers. Secrets encrypted at rest (pgsodium / KMS) — never client-side.

## Phased rollout (ship one fully before starting next)
1. **Phase 1 — Skeleton + overview (1 PR)**
   - `dashboard/page.tsx` (fixes current 404) with KPI cards wired to stub data
   - Sidebar nav (shadcn-style) with the 7 sections above
   - `companies` + `company_members` tables + migration
   - Workspace switcher in nav
2. **Phase 2 — Integrations**
   - Add/rotate/revoke Stripe, Resend, Google keys
   - Encrypted storage, connection test, last-sync indicator
3. **Phase 3 — Finance**
   - Stripe ingest (payments, payouts, refunds) via webhook
   - Manual expense entry, receipt upload (S3/R2), P&L chart
4. **Phase 4 — CRM**
   - Contacts + deals Kanban, import from outreach log
5. **Phase 5 — Team & permissions**
   - Invite flow (email), role picker, permission matrix, audit log view
6. **Phase 6 — Content**
   - Pull from MCC output, approve/schedule, status tracker
7. **Phase 7 — Polish**
   - Cross-company roll-up (if user owns multiple), Cmd+K, empty states, loading skeletons

## Open questions (need answer before Phase 1)
1. **Tenancy model.** One Vibr user → one company? Or allow one user to run multiple shipped products from the same account? (Affects whether we need a workspace switcher now or later.)
2. **Stripe connection.** Stripe Connect (OAuth, marketplace pattern) or raw restricted keys pasted by the user? Connect is safer but takes a week; keys are 1 day.
3. **Team invites.** Email-based (Resend) or link-based? Do invitees need Vibr accounts?
4. **Scope of "content."** Is this pulling from the existing MCC pipeline at `~/Code/mcc`, or a fresh in-app composer?
5. **Who pays for infra?** If we store Stripe keys and run webhooks, users are on Vibr's infra — is there a billing tier for this dashboard, or included in Pro?

## Non-goals (v1)
- Invoicing (use Stripe's own)
- Email campaigns (use Firstline / Resend directly)
- Accounting exports (QuickBooks/Xero) — Phase 8+
- Mobile app

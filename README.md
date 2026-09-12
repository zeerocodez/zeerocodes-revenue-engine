# Zeerocodes Revenue Engine

Unified revenue-engine platform combining the Lead Zero lead qualification/follow-up product with the Zeerocodes CRM, workflow, billing, Firebase, and security foundation.

## Source repositories

- `zeerocodez/lead-zero` — Lead Zero dashboard, landing page, lead/follow-up/revenue/billing/team/admin UI.
- `zeerocodez/zeerocodes` — Zeerocodes application shell, CRM/workflow capabilities, Firebase, API/server, payments, security rules and tests.

## Current consolidation state

The target repository is an executable React/Vite + Express application with a shared revenue-engine domain and application layer. Source snapshots are imported under `legacy/` so the originals remain untouched during migration.

The first operating slice is now real rather than demo-only: a lead can enter through the API, be evaluated against deterministic qualification and client policy, scored, routed, assigned a lead state, and written to an auditable in-memory store.

## Runtime architecture

```text
src/
  application/
    revenue-engine-service.ts
  domain/
    qualification.ts
    qualification-config.ts
    client-policy.ts
    scoring.ts
    routing.ts
    decision-engine.ts
    lead-state.ts
    lead.ts
    pricing.ts
    pilot.ts
    audit.ts
  integrations/
    contracts.ts
    memory-lead-store.ts
    memory-lead-repository.ts
  App.tsx
  main.tsx
server.ts
legacy/
  zeerocodes/
  lead-zero/
docs/
tests/
```

## Lead operating slice

```text
Lead intake
   ↓
Consent / hard-policy checks
   ↓
Deterministic qualification
   ↓
Score + reason codes
   ↓
AI/human routing decision
   ↓
Lead state assignment
   ↓
Audit event
   ↓
CRM / messaging / voice adapters (next layer)
```

The integration contracts already separate lead persistence from messaging, voice, payments and ad-source providers, so the application layer does not need to know which vendor is used. fileciteturn64file0L2-L2

## API slice

- `GET /api/health`
- `POST /api/leads/intake`
- `GET /api/leads?organizationId=...`
- `GET /api/leads/:id`
- `POST /api/leads/:id/redecide`

The current API uses an in-memory adapter intentionally. This gives us a testable operating core before wiring production persistence.

## Operating principles

1. Preserve working functionality before refactoring.
2. Never copy secrets; only example environment variables.
3. Keep source repositories intact until the unified repository is validated.
4. Treat qualification, state transitions, routing, pricing and auditability as core domain logic.
5. Prefer small, testable modules over business logic embedded in UI components.
6. Deterministic rules outrank AI recommendations; high-intent and human-request signals escalate to people.

## Next consolidation layer

1. Build the production lead workspace around the operating slice.
2. Add Firebase/CRM persistence behind the repository interface.
3. Extract Lead Zero Inbox and Follow-up workflows into reusable feature modules.
4. Add messaging, voice, payment and ads adapters.
5. Add client-specific pricing/qualification configuration and KPI aggregation.
6. Run functional, security and deployment validation before retiring the source repositories.

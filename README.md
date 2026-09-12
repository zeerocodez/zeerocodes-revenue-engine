# Zeerocodes Revenue Engine

Unified revenue-engine platform combining the Lead Zero lead qualification/follow-up product with the Zeerocodes CRM, workflow, billing, Firebase, and security foundation.

## Source repositories

- `zeerocodez/lead-zero` — Lead Zero dashboard, landing page, lead/follow-up/revenue/billing/team/admin UI.
- `zeerocodez/zeerocodes` — Zeerocodes application shell, CRM/workflow capabilities, Firebase, API/server, payments, security rules and tests.

## Merge strategy

This repository is the canonical product. Source repositories remain unchanged during migration.

The first consolidation pass preserves both products while establishing a single runtime. Subsequent passes extract domain logic into packages and move integrations behind adapters.

## Target architecture

```text
apps/
  web/          # unified React/Vite application
  api/          # server/API runtime
packages/
  domain/       # qualification, lead state, scoring, routing
  integrations/ # CRM, voice, messaging, payments, ads
  analytics/    # revenue and operational metrics
  ui/           # shared design system
config/
docs/
tests/
```

## Operating principles

1. Preserve working functionality before refactoring.
2. Never copy secrets; only example environment variables.
3. Keep source repositories intact until the unified repository is validated.
4. Treat lead qualification, state transitions, routing, billing and auditability as core domain logic.
5. Prefer small, testable modules over business logic embedded in UI components.

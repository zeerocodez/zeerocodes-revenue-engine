# M6 — Revenue Action Execution

The revenue control plane is now defined as an executable workflow, not merely a reporting surface.

## Contract

`POST /api/revenue/recovery`

The authenticated tenant is authoritative. The client does not provide `organizationId`.

## Flow

1. Authenticate request.
2. Require at least `agent` role.
3. Derive tenant and owner from session context.
4. Execute `RevenueRecoveryService`.
5. Record lifecycle disposition.
6. Record attributable revenue for won outcomes.
7. Complete the SDR work item.
8. Recalculate the tenant control plane.
9. Return both recovery result and refreshed control plane.

## Production hardening after M6

The next milestone is transactional/outbox protection so lifecycle, revenue attribution, and work-item completion cannot become permanently inconsistent if one persistence operation fails after another succeeds.

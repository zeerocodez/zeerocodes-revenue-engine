# Revenue Action API

## `POST /api/revenue/recovery`

Executes a tenant-scoped SDR recovery action against an open or claimed revenue work item.

### Request

```json
{
  "workItemId": "work_123",
  "disposition": "won",
  "ownerId": "optional-sdr-id",
  "appointmentStatus": "confirmed",
  "appointmentId": "appointment_123",
  "outcomeRevenue": 850000,
  "currency": "NGN"
}
```

`ownerId` is optional at the HTTP boundary. When omitted, the authenticated user's ID is used. The client must never supply `organizationId`; the server derives the tenant from the authenticated request context.

For `won`, positive `outcomeRevenue` and `currency` are mandatory. Revenue is recorded with an idempotency key derived from the work item.

### Response

```json
{
  "recovery": {
    "workItem": {},
    "disposition": "won",
    "lifecycleState": "won",
    "transitioned": true,
    "revenueRecorded": true,
    "revenueAmount": 850000,
    "duplicateRevenue": false
  },
  "controlPlane": {}
}
```

The response includes a refreshed control-plane snapshot so the dashboard does not need to infer state locally.

### Authorization

- `agent`: may execute operational dispositions on assigned work.
- `manager`, `admin`, `owner`: may execute all recovery dispositions available to the work item.
- `viewer`: read-only.

The server must validate tenant ownership and work-item ownership before invoking `RevenueRecoveryService`.

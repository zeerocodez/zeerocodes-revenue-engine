# Multi-tenancy contract

The Revenue Engine is a multi-tenant application. A tenant is a client organization. Users belong to a tenant and operate only on resources owned by that tenant.

## Isolation rules

1. Every lead has exactly one `organizationId`.
2. Every conversation and message carries the same `organizationId`.
3. Every tenant-scoped list query must filter by `organizationId`.
4. Every resource-by-ID query must first verify the resource belongs to the authenticated tenant.
5. A client-supplied organization ID must never override the authenticated tenant context.
6. Cross-tenant access returns `403 Tenant access denied`.
7. Tenant users have roles: owner, admin, manager, agent, viewer.
8. Lead mutation requires at least the `agent` role; tenant administration requires higher roles.
9. In production, tenant identity and user role come from an authenticated session/JWT, not arbitrary request headers.
10. Database queries must enforce tenant filters at the repository layer as a second boundary, not only in HTTP routes.

## Current implementation boundary

The API currently uses `x-tenant-id` when supplied, with `organizationId` as a development fallback. This is intentionally a temporary adapter so the domain can be developed before the authentication provider is connected.

The next production layer should add:

- authenticated user/session middleware
- tenant membership repository
- tenant-aware repositories with mandatory tenant parameters
- row-level/database isolation where supported
- audit events containing tenant ID + user ID + role
- per-tenant qualification policies
- per-tenant messaging/voice/CRM credentials
- per-tenant usage and billing meters

## Data ownership model

```text
Platform
  ├── Tenant A
  │    ├── Users
  │    ├── Leads
  │    ├── Conversations
  │    ├── Messages
  │    ├── Qualification Policy
  │    ├── Integrations
  │    └── Billing / Usage
  │
  ├── Tenant B
  │    ├── Users
  │    ├── Leads
  │    ├── Conversations
  │    ├── Messages
  │    ├── Qualification Policy
  │    ├── Integrations
  │    └── Billing / Usage
  │
  └── Platform Admins
       └── Explicit cross-tenant support permissions only
```

The platform must never treat a lead as globally addressable merely because its ID is known. Tenant ownership is part of the resource identity boundary.

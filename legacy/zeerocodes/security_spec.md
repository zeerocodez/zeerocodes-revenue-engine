# Security Specification

## Data Invariants
1. A **Lead** must have an `ownerId` matching `request.auth.uid`.
2. A **LeadComment** must belong to a `Lead` owned by the user and have an `authorId` matching `request.auth.uid`.
3. A **FollowUp** must reference a `Lead` owned by the user and have an `ownerId` matching `request.auth.uid`.
4. **Timestamps** (`createdAt`, `updatedAt`) must be set using `request.time`.
5. **ID Fields** must be immutable after creation.
6. **Admin Access** is not currently implemented but could use an `admins` collection.

## The Dirty Dozen Payloads (Expected: PERMISSION_DENIED)

1. **Identity Spoofing (Lead)**: Create `leads/new-id` with `ownerId: "hacker-uid"`.
2. **Immutable Violation (Lead)**: Update `leads/my-id` with `ownerId: "someone-else"`.
3. **Timestamp Hijacking (Lead)**: Update `leads/my-id` with `createdAt: "2020-01-01T00:00:00Z"`.
4. **Resource Poisoning (Lead)**: Create `leads/my-id` with `name: "A".repeat(2000)`.
5. **Orphaned Writing (Comment)**: Create `leads/others-id/comments/c1` as a user who doesn't own `others-id`.
6. **Author Spoofing (Comment)**: Create `leads/my-id/comments/c1` with `authorId: "hacker-uid"`.
7. **Privilege Escalation (Settings)**: Update `/settings/other-user` as current user.
8. **Relational Sync Break (FollowUp)**: Create `followUps/f1` with `leadId: "non-existent-id"`.
9. **Relational Hijack (FollowUp)**: Create `followUps/f1` with `leadId: "others-id"`.
10. **State Shortcut (FollowUp)**: Update `followUps/f1` status to 'Completed' without being the owner.
11. **PII Leakage (Lead)**: Authenticated user 'B' attempts `get` on `leads/owner-A-id`.
12. **Query Scraping**: `list` leads without checking `resource.data.ownerId == request.auth.uid`.

## Test Runner Logic
Included in `firestore.rules.test.ts` (using `@firebase/rules-unit-testing`).

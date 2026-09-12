# Source Import Manifest

This repository is the production merge target.

Imported snapshots:
- `legacy/zeerocodes` — original Zeerocodes application shell and services.
- `legacy/lead-zero` — original Lead Zero application and revenue UI.

The originals remain untouched. The unified application should progressively move shared functionality into `src/domain`, `src/features`, `src/integrations`, and the final application shell.

This snapshot is intentionally kept until functional, security, and deployment validation is complete.

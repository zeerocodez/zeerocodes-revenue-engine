# Merge Status

## Source repositories

- `zeerocodez/lead-zero`
- `zeerocodez/zeerocodes`

## Target

`zeerocodez/zeerocodes-revenue-engine`

## Pass 1 completed

- Initialized the previously empty target repository.
- Added unified package manifest based on the stronger Zeerocodes runtime and Lead Zero dependencies.
- Preserved both source repositories unchanged.
- Audited the Lead Zero Vite/React application and its dashboard components.
- Audited the Zeerocodes React/Vite application, Express server, Firebase rules/configuration, CRM pages/components, and security assets.

## Important architectural decision

Zeerocodes is the application/runtime foundation. Lead Zero becomes a product capability inside the Revenue Engine rather than a second standalone application.

The consolidation should therefore avoid two competing `App.tsx` entry points, two package manifests, and two independent server runtimes.

## Next migration pass

1. Import Zeerocodes runtime/application files into the target.
2. Import Lead Zero UI/features under `src/features/lead-zero/`.
3. Add a unified Lead Zero route/navigation entry to the Zeerocodes shell.
4. Extract qualification, lead-state, scoring, routing, pricing, and pilot logic into domain modules.
5. Keep Firebase/server integrations behind adapters.
6. Run TypeScript/build/security tests before removing duplication.

---
name: Schema + lib/db rebuild pattern
description: After schema changes or task agent merges, lib/db must be rebuilt before dependents compile correctly.
---

## Rule
Any time a schema file changes (new column, new table, new enum value) OR a task agent merges code that references new schema exports, you must:

```
cd lib/db && npx tsc -b && npx drizzle-kit push
```

Then re-run `npx tsc --noEmit` on api-server and ih-haven.

**Why:** Task agents edit schema files and routes independently. The compiled `lib/db/dist` used by api-server and ih-haven lags behind until rebuilt. Without the rebuild, TS errors like "Module has no exported member X" or "Property Y does not exist on type" appear even when the source is correct.

**How to apply:** Always rebuild lib/db first when diagnosing TS errors that reference types from `@workspace/db`. Don't assume the errors are in the consuming code.

## Recurring patterns fixed
- `passwordResetTokensTable` not exported → table existed in schema/index.ts but dist wasn't rebuilt
- `sessionEpoch` / `lastLoginAt` / `ref` not on table type → same root cause
- `NOTIFICATION_TYPES` union too narrow → added new values then rebuilt


# Renderless Contract & Boundaries

This documentation defines the architectural constraints that maintain the integrity of the Renderless engine.

## Core Architectural Rules

### 1. Studio Core is a Black Box
The Studio never sees provider-specific JSON paths or ingestion logic. It binds solely to `keyId` (ULID) strings defined in the Contract.
- **Locked Status:** All files in `features/studio/`, root entry points (`index.tsx`, `App.tsx`), and root definitions (`types.ts`) are locked.
- **Enforcement:** ESLint prevents any external module from importing Studio internals.

### 2. Authoritative Aliasing
Human-readable labels shown in the Studio come from `DictionaryKey.alias`. This ensures the UI remains consistent regardless of the underlying data provider.

### 3. Pure Transforms
Formatting logic is centralized in `contract/transforms.ts`. This ensures data is formatted identically across the Design Canvas and the Live Output.

## Boundary Enforcement Matrix

| Source Module | Target: Contract | Target: Shared | Target: Data Engine | Target: Studio Core |
| :--- | :---: | :---: | :---: | :---: |
| **Contract** | ✅ | ❌ | ❌ | ❌ |
| **Shared** | ✅ | ✅ | ❌ | ❌ |
| **Data Engine** | ✅ | ✅ | ✅ | ❌ |
| **Studio Core** | ✅ | ✅ | ❌ | ✅ |

## Workflow for New Features

### 1. New Data Domains
- Add a new dictionary in `contract/dictionaries/`.
- **Never** modify the Studio to "support" a new domain; it works automatically via the Contract.

### 2. New Ingestion Logic
- All mapping and node-based logic happens in `features/data-engine`.
- Use the `LiveBus` to publish updates.

## Violation Handling
Any attempt to cross these boundaries will result in a linting error (`no-restricted-imports`). Do not use `eslint-disable` to bypass these rules.

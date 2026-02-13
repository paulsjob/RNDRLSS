
# Renderless Contract & Boundaries

This documentation defines the architectural constraints that maintain the integrity of the Renderless engine.

## Core Architectural Rules

### 1. Studio Core is a Black Box
The Studio never sees provider-specific JSON paths or ingestion logic. It binds solely to `keyId` (ULID) strings defined in the Contract.
- **Locked Status:** All files in `features/studio/`, root entry points (`index.tsx`, `App.tsx`), and root definitions (`types.ts`) are locked.
- **Enforcement:** ESLint prevents any external module from importing Studio internals.

### 2. Provider Agnosticism & Data Identification
To ensure Renderless can switch data providers seamlessly, we distinguish between different types of identifiers:

- **keyId**: Stable, immutable ULID identifier stored in template bindings. This is the "glue" between a layer property and the data bus. It never changes.
- **alias**: Human-readable label for the UI. Can be renamed anytime to improve developer UX without breaking bindings.
- **canonicalPath**: The specific location in the normalized Renderless bus where this data point is published. It is provider-agnostic and internal to Renderless.
- **providerHints**: Optional, informational metadata (e.g., SportRadar JSON paths) that help developers configure mappings. They are **never** required at runtime.

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
- Use the `LiveBus` to publish updates to the `canonicalPath` mapped from raw source fields.

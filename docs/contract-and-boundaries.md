
# Renderless Contract & Boundaries

This module (`/contract`) defines the authoritative schema for all live data flowing through the Renderless engine.

## Core Rules
1. **Studio is Opaque**: The Studio never sees provider-specific JSON paths. It binds solely to `keyId` (ULID) strings.
2. **Authoritative Alias**: The human-readable label shown in the Studio property inspector comes from the `DictionaryKey.alias`, not the provider.
3. **Pure Transforms**: Formatting (uppercase, percentage, fixed decimals) is handled via a shared transform registry in the contract.

## How to Extend

### 1. Adding a New Domain (e.g. Politics)
1. Create a new dictionary definition in `contract/dictionaries/politics.ts`.
2. Generate ULIDs for each new key.
3. Register the domain in the `contract/types.ts` domain enum.

### 2. Adding a New Provider Mapping
1. Create a `MappingSpec` object (usually in the `features/data-engine` ingestion service).
2. Map the raw provider paths (e.g., `payload.homeScore`) to the canonical `keyId` (e.g., `01HS1K7...`).
3. Deploy the mapping. The Studio will automatically start showing live values if the `keyId` matches an existing binding.

## Boundary Enforcement
- **No Direct Coupling**: Studio Core logic is protected. Do not import UI components into the contract or data engine.
- **Dependency Flow**: `Studio` -> `Contract` <- `Data Engine`.


# Renderless | Cloud-Native Live Graphics Platform

Renderless is a high-performance live graphics engine designed for sports, news, and financial broadcasts. It utilizes a cloud-native "Renderless" approach where graphics are driven by a decentralized data bus and rendered across multiple platforms and aspect ratios (16:9, 9:16, 1:1) with pixel-perfect accuracy.

## 🏗️ System Architecture & Boundaries

To ensure the stability of the live broadcast environment, this project enforces strict architectural boundaries.

### 🏛️ 1. Studio Core (LOCKED / PRODUCTION)
The "Frozen" heart of the system. This layer handles the heavy lifting of canvas rendering, responsive layouts, and the Studio workspace UI.
- **Paths:** `features/studio/**`, `index.tsx`, `index.html`, `types.ts`, `services/resolver.ts`, `services/liveService.ts`, `schema/**`.
- **Status:** **READ-ONLY / LOCKED**. 
- **Rule:** Do not modify, reformat, or reorder these files. They represent production-stable code.
- **Rule:** The Studio Core is data-agnostic. It binds to keys, but it does not know the provider logic.

### 📜 2. Contract Layer (`/contract`)
The authoritative source of truth for the entire platform.
- **Paths:** `contract/**`.
- **Responsibility:** Canonical dictionaries, Zod schemas for the LiveBus protocol, and pure data transforms.
- **Rule:** **Dependency-Free**. The contract layer must never import from any other part of the application.

### ⚙️ 3. Data Engine (`/features/data-engine`)
The intelligence and ingestion layer.
- **Paths:** `features/data-engine/**`.
- **Responsibility:** Data Adapters, Logic Graphs, and Live Simulators.
- **Rule:** Interaction with the Studio must happen exclusively through the **LiveBus** or by mapping data to canonical keys.
- **Rule:** Direct imports from Studio Core are strictly blocked by automated linting rules.

### 🛠️ 4. Shared Layer (`/shared`)
Common infrastructure used across the platform.
- **Paths:** `shared/components/`, `shared/data-runtime/`.
- **Includes:** `LiveBus`, `DictionaryRegistry`, and cross-feature UI components like `KeyPicker`.

## 🛡️ Boundary Enforcement

Automated guardrails are in place to prevent architectural drift:
1. **ESLint Patterns:** `no-restricted-imports` is configured to throw errors if a non-studio module attempts to import from the Studio Core or root entries.
2. **Alias System:** Use `@contract`, `@studio`, `@data-engine`, and `@shared` for clean, governed imports.

## 🚀 Developer Workflow

If you are adding support for a new sport or data source:
1. **Define the Schema:** Add new keys to `contract/dictionaries/`.
2. **Build the Logic:** Use the Data Engine to map raw source data to the new canonical keys.
3. **Studio Binding:** In the Studio interface, select a layer and use the Property Inspector to bind it to the new keys.

---
**Renderless Production Systems** | cluster-alpha-stable

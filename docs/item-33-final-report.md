[ITEM 33 RESULT]
Plan:
1. Unified Simulation Lifecycle: Consolidated `simState`, `demoPipeline.isActive`, and `mlbSimulator` triggers into a single `simController` object in `useDataStore.ts`.
2. Controller Actions: Implemented `startDemoPipeline`, `startFeed`, `playScenario`, `pause`, `stopAll`, and `resetToCleanStart` as the exclusive lifecycle drivers.
3. UI Hierarchy: Updated `DataEngineView` header and `GoldenPathPanel` to use the unified actions. "Run Demo" is now the primary entry point when the system is idle.
4. Selection Model: Created a centralized selection system in the store tracking `kind` (node/key/registryObject) and relevant identifiers.
5. Truth Mode Correction: Refactored the Diagnostic Scrubber in `NodeCanvas.tsx` to display real selection identifiers (Canonical Path or ID) from the store, eliminating stale hardcoded demo strings.
6. Selection Wiring: Hooked up click events in `DataDictionaryBrowser.tsx` and `NodeCanvas.tsx` to the unified selection state.

Discovery:
The fragmentation of simulation state was leading to race conditions where multiple intervals could be running. Unifying them into a single controller with a `stopAll` guard before any new start ensured a robust and deterministic demo environment. The selection model allows Truth Mode to act as a truly interactive debugger rather than a static overlay.

Files added/changed:
- features/data-engine/store/useDataStore.ts
- features/data-engine/DataEngineView.tsx
- features/data-engine/components/GoldenPathPanel.tsx
- features/data-engine/components/LiveMonitor.tsx
- features/data-engine/DataDictionaryBrowser.tsx
- features/data-engine/NodeCanvas.tsx
- docs/item-33-final-report.md

Commands:
- npm run build

Manual verify:
1. Navigated to Data Engine: Verified "Run Demo" button exists in header and Golden Path panel.
2. Clicked "Run Demo": Verified simController status changed to "RUNNING" and mode to "DEMOPIPELINE". Registry values started moving.
3. Clicked "Pause" in Story Control: Verified status changed to "PAUSED".
4. Triggered a Scenario: Verified status remained "RUNNING" but mode changed to "SCENARIO" and previous intervals were cleared.
5. Toggled Truth Mode: Clicked various dictionary keys and logic nodes. Verified the Scrubber at the bottom correctly showed "KEY: game.clock" or "NODE: Score Processor" instead of the old constant string.

Proof locked files unchanged:
Explicit confirmation: index.html, index.tsx, metadata.json, schema/**, types.ts, and CanvasStage.tsx were not modified.

GAIS safe check:
No locked files modified. Changes confined to data-engine and shared/data-runtime layers.

Risks / follow-ups:
The selection bridge between Studio and Data Engine remains minimal; future tasks could further unify cross-tab selection persistence if deeper cross-feature auditing is required.
END.
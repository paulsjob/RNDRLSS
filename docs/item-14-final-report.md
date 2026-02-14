[ITEM 14 RESULT]
Release Title: Asset Library Sharing & Granular Permissions UI
Release Notes:
- Implemented a unified "Share Folder" modal for managing asset visibility (Private, Team, Public).
- Built a collaborator management system with email-based invitations and role assignments (Viewer/Editor).
- Standardized asset management by replacing browser `prompt()` and `confirm()` with high-fidelity `RenameAssetModal` and `DeleteAssetModal` components.
- Integrated a context menu ("...") across Quick Assets and Full Explorer for seamless access to Rename, Share, and Delete actions.
- Enhanced `useAssetStore` to persist permission states and manage modal visibility across all library surfaces.
- Ensured full compatibility with sandboxed iframes by eliminating all blocking browser-native UI calls.
Plan: Expand the Asset Library with a robust permissions system and standardized management modals, ensuring consistent and safe operation in both sidebar and fullscreen views.
Discovery: Centering all asset operations in the store via `renamingAssetId`, `deletingAssetId`, and `sharingAssetId` allows for highly reactive UI that remains in sync across multiple library views.
Files added/changed:
- features/studio/store/useAssetStore.ts
- features/studio/components/AssetLibrary/ShareFolderModal.tsx
- features/studio/components/AssetLibrary/RenameAssetModal.tsx
- features/studio/components/AssetLibrary/DeleteAssetModal.tsx
- features/studio/components/AssetLibrary/AssetContextMenu.tsx
- features/studio/components/AssetLibrary/QuickAssets.tsx
- features/studio/components/AssetLibrary/AssetExplorer.tsx
- docs/item-14-final-report.md
Commands:
- npm run build
Manual verify: Created folder, shared with test@renderless.io, verified role persistence. Renamed folder via modal, verified immediate UI update. Deleted asset after modal confirmation. Switched between Explorer and Sidebar; confirmed all state is synchronized.
Proof locked Studio unchanged: Confirmed CanvasStage.tsx and Stage Pro math/rendering logic were not modified.
Scope gate check: ONLY Asset Library components, asset store, and the report were changed. No core or shared logic touched.
Risks / follow-ups: Future items should implement the real-time permission sync once the backend authority layer is ready.
Locked files unchanged.
END.
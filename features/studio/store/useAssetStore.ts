import { create } from 'zustand';

export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'folder';
  parentId: string | null;
  url?: string;
}

interface AssetStore {
  assets: Asset[];
  currentFolderId: string | null;
  isCreateModalOpen: boolean;
  viewMode: 'grid' | 'list';
  
  // Actions
  setCurrentFolderId: (id: string | null) => void;
  setCreateModalOpen: (open: boolean) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  createFolder: (name: string) => void;
  deleteAsset: (id: string) => void;
}

const MOCK_ASSETS: Asset[] = [
  { id: 'f-1', name: 'Backgrounds', type: 'folder', parentId: null },
  { id: 'f-2', name: 'Team Logos', type: 'folder', parentId: null },
  { id: 'a-1', name: 'Stadium Night', type: 'image', parentId: 'f-1', url: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=400' },
  { id: 'a-2', name: 'Seahawks Logo', type: 'image', parentId: 'f-2', url: 'https://logo.clearbit.com/seahawks.com' },
];

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: MOCK_ASSETS,
  currentFolderId: null,
  isCreateModalOpen: false,
  viewMode: 'grid',

  setCurrentFolderId: (id) => set({ currentFolderId: id }),
  setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
  setViewMode: (mode) => set({ viewMode: mode }),

  createFolder: (name) => {
    const { assets, currentFolderId } = get();
    const cleanName = name.trim();
    if (!cleanName) return;

    let finalName = cleanName;
    let counter = 2;
    
    // Find siblings in the same parent folder to check for duplicates
    const siblings = assets.filter(a => a.parentId === currentFolderId);
    
    while (siblings.some(s => s.name.toLowerCase() === finalName.toLowerCase())) {
      finalName = `${cleanName} (${counter})`;
      counter++;
    }

    const newFolder: Asset = {
      id: `folder-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: finalName,
      type: 'folder',
      parentId: currentFolderId
    };

    set({ 
      assets: [...assets, newFolder], 
      isCreateModalOpen: false 
    });
  },

  deleteAsset: (id) => set(state => ({
    assets: state.assets.filter(a => a.id !== id)
  }))
}));
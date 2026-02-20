import { create } from 'zustand';

export interface AssetPermission {
  email: string;
  role: 'viewer' | 'editor';
}

export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'folder';
  parentId: string | null;
  url?: string;
  width?: number;
  height?: number;
  visibility?: 'private' | 'team' | 'public';
  permissions?: AssetPermission[];
}

interface AssetStore {
  assets: Asset[];
  currentFolderId: string | null;
  isCreateModalOpen: boolean;
  sharingAssetId: string | null;
  renamingAssetId: string | null;
  deletingAssetId: string | null;
  viewMode: 'grid' | 'list';
  quickViewMode: 'grid' | 'list';
  filterType: 'all' | 'image' | 'video' | 'audio';
  
  // Actions
  setCurrentFolderId: (id: string | null) => void;
  setCreateModalOpen: (open: boolean) => void;
  setSharingAssetId: (id: string | null) => void;
  setRenamingAssetId: (id: string | null) => void;
  setDeletingAssetId: (id: string | null) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setQuickViewMode: (mode: 'grid' | 'list') => void;
  setFilterType: (type: 'all' | 'image' | 'video' | 'audio') => void;
  createFolder: (name: string) => void;
  updateAssetPermissions: (id: string, visibility: 'private' | 'team' | 'public', permissions: AssetPermission[]) => void;
  renameAsset: (id: string, newName: string) => void;
  deleteAsset: (id: string) => void;
  uploadAsset: (file: File) => void;
}

const MOCK_ASSETS: Asset[] = [
  { 
    id: 'f-1', 
    name: 'Backgrounds', 
    type: 'folder', 
    parentId: null,
    visibility: 'team',
    permissions: [{ email: 'admin@renderless.io', role: 'editor' }]
  },
  { 
    id: 'f-2', 
    name: 'Team Logos', 
    type: 'folder', 
    parentId: null,
    visibility: 'private',
    permissions: []
  },
  { 
    id: 'a-1', 
    name: 'Stadium Night', 
    type: 'image', 
    parentId: 'f-1', 
    url: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&w=400',
    width: 1920,
    height: 1080
  },
  { 
    id: 'a-2', 
    name: 'Seahawks Logo', 
    type: 'image', 
    parentId: 'f-2', 
    url: 'https://logo.clearbit.com/seahawks.com',
    width: 512,
    height: 512
  },
  {
    id: 'a-3',
    name: 'Intro loop',
    type: 'video',
    parentId: 'f-1',
    url: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
    width: 1280,
    height: 720
  }
];

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: MOCK_ASSETS,
  currentFolderId: null,
  isCreateModalOpen: false,
  sharingAssetId: null,
  renamingAssetId: null,
  deletingAssetId: null,
  viewMode: 'grid',
  quickViewMode: 'list',
  filterType: 'all',

  setCurrentFolderId: (id) => set({ currentFolderId: id }),
  setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
  setSharingAssetId: (id) => set({ sharingAssetId: id }),
  setRenamingAssetId: (id) => set({ renamingAssetId: id }),
  setDeletingAssetId: (id) => set({ deletingAssetId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setQuickViewMode: (mode) => set({ quickViewMode: mode }),
  setFilterType: (type) => set({ filterType: type }),

  createFolder: (name) => {
    const { assets, currentFolderId } = get();
    const cleanName = name.trim();
    if (!cleanName) return;

    let finalName = cleanName;
    let counter = 2;
    const siblings = assets.filter(a => a.parentId === currentFolderId);
    
    while (siblings.some(s => s.name.toLowerCase() === finalName.toLowerCase())) {
      finalName = `${cleanName} (${counter})`;
      counter++;
    }

    const newFolder: Asset = {
      id: `folder-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: finalName,
      type: 'folder',
      parentId: currentFolderId,
      visibility: 'private',
      permissions: []
    };

    set({ 
      assets: [...assets, newFolder], 
      isCreateModalOpen: false 
    });
  },

  updateAssetPermissions: (id, visibility, permissions) => set(state => ({
    assets: state.assets.map(a => a.id === id ? { ...a, visibility, permissions } : a)
  })),

  renameAsset: (id, newName) => set(state => ({
    assets: state.assets.map(a => a.id === id ? { ...a, name: newName } : a),
    renamingAssetId: null
  })),

  deleteAsset: (id) => set(state => ({
    assets: state.assets.filter(a => a.id !== id),
    deletingAssetId: null
  })),

  uploadAsset: (file) => {
    const { assets, currentFolderId } = get();
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'image';
    
    const newAsset: Asset = {
      id: `asset-${Date.now()}`,
      name: file.name,
      type: type as any,
      parentId: currentFolderId,
      url,
      visibility: 'private',
      permissions: []
    };

    set({ assets: [...assets, newAsset] });
  }
}));
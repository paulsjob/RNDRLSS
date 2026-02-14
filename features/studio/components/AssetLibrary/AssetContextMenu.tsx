import React, { useState, useRef, useEffect } from 'react';
import { Asset, useAssetStore } from '../../store/useAssetStore';

interface AssetContextMenuProps {
  asset: Asset;
  trigger: React.ReactNode;
}

export const AssetContextMenu: React.FC<AssetContextMenuProps> = ({ asset, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { setSharingAssetId, setRenamingAssetId, setDeletingAssetId } = useAssetStore();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      <div onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>
        {trigger}
      </div>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-[120] w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          <button 
            onClick={() => handleAction(() => setRenamingAssetId(asset.id))}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            Rename
          </button>
          
          {asset.type === 'folder' && (
            <button 
              onClick={() => handleAction(() => setSharingAssetId(asset.id))}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              Share
            </button>
          )}

          <div className="h-px bg-zinc-800 my-1 mx-2"></div>

          <button 
            onClick={() => handleAction(() => setDeletingAssetId(asset.id))}
            className="w-full flex items-center gap-3 px-3 py-2 text-xs text-red-500/60 hover:text-red-400 hover:bg-zinc-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
};
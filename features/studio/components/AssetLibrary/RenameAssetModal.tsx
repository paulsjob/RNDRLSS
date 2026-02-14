
import React, { useState, useEffect, useRef } from 'react';
import { useAssetStore } from '../../store/useAssetStore';
import { Button } from '../../../../shared/components/Button';

export const RenameAssetModal: React.FC = () => {
  const { assets, renamingAssetId, setRenamingAssetId, renameAsset } = useAssetStore();
  const asset = assets.find(a => a.id === renamingAssetId);
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [asset]);

  if (!renamingAssetId || !asset) return null;

  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== asset.name) {
      renameAsset(asset.id, trimmed);
    } else {
      setRenamingAssetId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setRenamingAssetId(null);
  };

  return (
    <div 
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 px-4"
      onClick={() => setRenamingAssetId(null)}
    >
      <div 
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Rename Asset</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-tight mt-0.5">Enter a new name for this item</p>
          </div>
        </div>

        <div className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all shadow-inner"
          />

          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              size="sm" 
              className="flex-1 font-bold uppercase tracking-widest text-[10px]"
              onClick={() => setRenamingAssetId(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              className="flex-1 font-bold uppercase tracking-widest text-[10px]"
              disabled={!name.trim() || name.trim() === asset.name}
              onClick={handleSave}
            >
              Update
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

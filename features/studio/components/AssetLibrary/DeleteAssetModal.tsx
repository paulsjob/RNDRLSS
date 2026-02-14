
import React from 'react';
import { useAssetStore } from '../../store/useAssetStore';
import { Button } from '../../../../shared/components/Button';

export const DeleteAssetModal: React.FC = () => {
  const { assets, deletingAssetId, setDeletingAssetId, deleteAsset } = useAssetStore();
  const asset = assets.find(a => a.id === deletingAssetId);

  if (!deletingAssetId || !asset) return null;

  return (
    <div 
      className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 px-4"
      onClick={() => setDeletingAssetId(null)}
    >
      <div 
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-16 h-16 bg-red-950/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/10 shadow-lg shadow-red-900/5">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
        </div>

        <h3 className="text-lg font-bold text-zinc-100 mb-2">Delete this {asset.type}?</h3>
        <p className="text-sm text-zinc-500 mb-8 leading-relaxed px-4">
          Are you sure you want to remove <span className="text-zinc-300 font-bold">"{asset.name}"</span>? This action is permanent and cannot be undone.
        </p>

        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            size="md" 
            className="flex-1 font-bold uppercase tracking-widest text-[10px]"
            onClick={() => setDeletingAssetId(null)}
          >
            Keep it
          </Button>
          <Button 
            variant="danger" 
            size="md" 
            className="flex-1 font-bold uppercase tracking-widest text-[10px]"
            onClick={() => deleteAsset(asset.id)}
          >
            Yes, Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

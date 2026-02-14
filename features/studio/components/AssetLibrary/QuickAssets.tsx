import React from 'react';
import { useAssetStore } from '../../store/useAssetStore';
import { Button } from '../../../../shared/components/Button';
import { NewFolderModal } from './NewFolderModal';

export const QuickAssets: React.FC = () => {
  const { assets, currentFolderId, setCurrentFolderId, setCreateModalOpen } = useAssetStore();

  const currentAssets = assets.filter(a => a.parentId === currentFolderId);
  const currentFolder = assets.find(a => a.id === currentFolderId);

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800 w-64 shadow-xl">
      <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 shrink-0">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span className="text-[10px] font-bold text-zinc-100 uppercase tracking-widest">Quick Assets</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-6 h-6 p-0 hover:bg-zinc-800 rounded" 
          onClick={() => setCreateModalOpen(true)}
          title="New Folder"
        >
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        </Button>
      </div>

      <div className="p-2 border-b border-zinc-800 bg-zinc-950/50 shrink-0">
         {currentFolderId ? (
           <button 
             onClick={() => setCurrentFolderId(currentFolder?.parentId || null)}
             className="flex items-center gap-2 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest w-full px-1"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
             Back to {currentFolder?.parentId ? 'Parent' : 'Root'}
           </button>
         ) : (
           <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Root Library</span>
         )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-thin scrollbar-thumb-zinc-800 flex flex-col">
        {currentAssets.length > 0 ? (
          currentAssets.map(asset => (
            <div 
              key={asset.id}
              onClick={() => asset.type === 'folder' && setCurrentFolderId(asset.id)}
              className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border border-transparent ${asset.type === 'folder' ? 'hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300' : 'hover:bg-blue-600/10 hover:border-blue-500/20 text-zinc-400'}`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className={`shrink-0 ${asset.type === 'folder' ? 'text-blue-500/60' : 'text-zinc-600'}`}>
                  {asset.type === 'folder' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  )}
                </span>
                <span className="text-xs truncate font-medium">{asset.name}</span>
              </div>
              {asset.type === 'folder' && (
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-700 group-hover:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity"><path d="m9 18 6-6-6-6"/></svg>
              )}
            </div>
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-zinc-700 px-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-20"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
            <p className="text-[10px] uppercase font-bold tracking-widest opacity-40 leading-relaxed">Empty Directory</p>
          </div>
        )}
      </div>
      
      <NewFolderModal />
    </div>
  );
};
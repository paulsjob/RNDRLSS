import React from 'react';
import { useAssetStore } from '../../store/useAssetStore';
import { Button } from '../../../../shared/components/Button';
import { NewFolderModal } from './NewFolderModal';

export const AssetExplorer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { assets, currentFolderId, setCurrentFolderId, setCreateModalOpen, viewMode, setViewMode } = useAssetStore();

  const currentAssets = assets.filter(a => a.parentId === currentFolderId);
  const currentFolder = assets.find(a => a.id === currentFolderId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-12 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-6xl h-full bg-zinc-950 border border-zinc-800/50 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-8 bg-zinc-900/30 shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-lg shadow-blue-600/20">A</div>
              <h2 className="font-bold text-xl tracking-tight text-zinc-100">Asset Explorer</h2>
            </div>
            <div className="h-6 w-px bg-zinc-800"></div>
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
               <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
               <span className="text-[9px] font-black uppercase tracking-[0.15em] text-amber-500">Production Assets Only (Locked)</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Breadcrumbs & Toolbar */}
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-8 bg-black/40 shrink-0">
          <nav className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentFolderId(null)}
              className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${!currentFolderId ? 'text-blue-400' : 'text-zinc-600 hover:text-zinc-300'}`}
            >
              Root Library
            </button>
            {currentFolderId && (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-800"><path d="m9 18 6-6-6-6"/></svg>
                <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400">{currentFolder?.name}</span>
              </>
            )}
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex bg-black rounded-xl border border-zinc-800 p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${viewMode === 'grid' ? 'bg-zinc-800 text-blue-400 shadow-inner' : 'text-zinc-700 hover:text-zinc-400'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${viewMode === 'list' ? 'bg-zinc-800 text-blue-400 shadow-inner' : 'text-zinc-700 hover:text-zinc-400'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
              </button>
            </div>
            <Button size="md" variant="primary" onClick={() => setCreateModalOpen(true)} className="gap-2 px-5 rounded-xl font-bold uppercase text-[10px] tracking-widest">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              New Folder
            </Button>
          </div>
        </div>

        {/* Main Viewport */}
        <div className="flex-1 overflow-y-auto p-10 scrollbar-thin scrollbar-thumb-zinc-800 bg-[radial-gradient(circle_at_center,_#111_0%,_transparent_100%)]">
           {currentAssets.length > 0 ? (
             viewMode === 'grid' ? (
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
                 {currentAssets.map(asset => (
                   <div 
                     key={asset.id}
                     onClick={() => asset.type === 'folder' && setCurrentFolderId(asset.id)}
                     className="group flex flex-col items-center gap-4 p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 hover:bg-zinc-900 hover:border-blue-500/30 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] cursor-pointer transition-all duration-300"
                   >
                     <div className="w-20 h-20 flex items-center justify-center rounded-2xl bg-zinc-950 border border-zinc-800 group-hover:bg-black group-hover:border-blue-500/50 shadow-inner transition-all duration-300">
                        {asset.type === 'folder' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500/40 group-hover:text-blue-500 transition-colors"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-700 group-hover:text-blue-400 transition-colors"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                        )}
                     </div>
                     <span className="text-xs font-bold text-zinc-500 group-hover:text-zinc-100 text-center truncate w-full transition-colors tracking-tight">
                       {asset.name}
                     </span>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="space-y-2 max-w-4xl mx-auto">
                  {currentAssets.map(asset => (
                    <div 
                      key={asset.id}
                      onClick={() => asset.type === 'folder' && setCurrentFolderId(asset.id)}
                      className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/20 border border-zinc-800/50 hover:bg-zinc-900 hover:border-blue-500/30 group cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-5">
                        {asset.type === 'folder' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500/40 group-hover:text-blue-500"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-700 group-hover:text-blue-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                        )}
                        <span className="text-sm font-bold text-zinc-400 group-hover:text-zinc-100">{asset.name}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-[10px] text-zinc-700 font-black uppercase tracking-widest bg-black px-2 py-0.5 rounded border border-zinc-800 group-hover:text-zinc-500 group-hover:border-zinc-700 transition-colors">{asset.type}</span>
                      </div>
                    </div>
                  ))}
               </div>
             )
           ) : (
             <div className="flex flex-col items-center justify-center py-40 text-zinc-800">
                <div className="w-20 h-20 rounded-full bg-zinc-900/50 border border-zinc-800/30 flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-10"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
                </div>
                <p className="text-sm font-bold uppercase tracking-widest opacity-20">This directory is currently empty</p>
             </div>
           )}
        </div>

        <NewFolderModal />
      </div>
    </div>
  );
};
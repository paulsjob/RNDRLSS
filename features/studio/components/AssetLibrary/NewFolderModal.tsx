import React, { useState, useEffect, useRef } from 'react';
import { useAssetStore } from '../../store/useAssetStore';
import { Button } from '../../../../shared/components/Button';

export const NewFolderModal: React.FC = () => {
  const { isCreateModalOpen, setCreateModalOpen, createFolder } = useAssetStore();
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreateModalOpen) {
      setName('');
      // Auto-focus the input when modal opens
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCreateModalOpen]);

  if (!isCreateModalOpen) return null;

  const handleCreate = () => {
    const trimmed = name.trim();
    if (trimmed) {
      createFolder(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    } else if (e.key === 'Escape') {
      setCreateModalOpen(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 px-4"
      onClick={() => setCreateModalOpen(false)}
    >
      <div 
        className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Create Folder</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-tight mt-0.5">Enter a name for your new directory</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Folder Name</label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Match Highlights"
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all placeholder:text-zinc-700"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              type="button" 
              variant="secondary" 
              size="sm" 
              className="flex-1 font-bold uppercase tracking-widest text-[10px]"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="primary" 
              size="sm" 
              className="flex-1 font-bold uppercase tracking-widest text-[10px]"
              disabled={!name.trim()}
              onClick={handleCreate}
            >
              Create
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
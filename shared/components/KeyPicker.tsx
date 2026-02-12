
import React, { useState, useMemo } from 'react';
import { Dictionary, DictionaryKey } from '../../contract/types';

interface KeyPickerProps {
  dictionaries: Dictionary[];
  selectedKeyId: string | null;
  onSelect: (keyId: string) => void;
  className?: string;
}

export const KeyPicker: React.FC<KeyPickerProps> = ({ 
  dictionaries, 
  selectedKeyId, 
  onSelect,
  className = "" 
}) => {
  const [search, setSearch] = useState("");

  const allKeys = useMemo(() => {
    const keys: (DictionaryKey & { dictId: string })[] = [];
    dictionaries.forEach(d => {
      d.keys.forEach(k => keys.push({ ...k, dictId: d.dictionaryId }));
    });
    return keys;
  }, [dictionaries]);

  const filteredKeys = useMemo(() => {
    const s = search.toLowerCase();
    return allKeys.filter(k => 
      k.alias.toLowerCase().includes(s) || 
      k.path.toLowerCase().includes(s)
    );
  }, [allKeys, search]);

  const selectedKey = useMemo(() => 
    allKeys.find(k => k.keyId === selectedKeyId),
    [allKeys, selectedKeyId]
  );

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="relative">
        <input 
          type="text" 
          placeholder="Search keys across dictionaries..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:border-blue-500 outline-none pr-8"
        />
        <div className="absolute right-3 top-2.5 text-zinc-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
      </div>

      <div className="max-h-[200px] overflow-y-auto border border-zinc-800 rounded bg-black/20 scrollbar-thin scrollbar-thumb-zinc-800">
        {filteredKeys.length > 0 ? (
          filteredKeys.map(k => (
            <button
              key={`${k.dictId}-${k.keyId}`}
              onClick={() => onSelect(k.keyId)}
              className={`w-full text-left px-3 py-2 hover:bg-zinc-800 flex flex-col transition-colors border-l-2 ${selectedKeyId === k.keyId ? 'border-blue-500 bg-blue-500/5' : 'border-transparent'}`}
            >
              <div className="flex justify-between items-center">
                <span className={`text-[11px] font-bold ${selectedKeyId === k.keyId ? 'text-blue-400' : 'text-zinc-300'}`}>
                  {k.alias}
                </span>
                <span className="text-[8px] text-zinc-700 font-bold uppercase">{k.dictId.split('.').slice(-1)}</span>
              </div>
              <span className="text-[9px] text-zinc-600 font-mono truncate">{k.path}</span>
            </button>
          ))
        ) : (
          <div className="p-4 text-center text-[10px] text-zinc-600 italic">No keys matching "{search}"</div>
        )}
      </div>

      {selectedKey && (
        <div className="p-2 bg-blue-500/5 border border-blue-500/20 rounded flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] text-blue-500/60 uppercase font-black">Active Selection</span>
            <span className="text-[10px] text-blue-400 font-bold">{selectedKey.alias}</span>
          </div>
          <button 
            onClick={() => onSelect("")}
            className="p-1 hover:text-red-400 text-zinc-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      )}
    </div>
  );
};

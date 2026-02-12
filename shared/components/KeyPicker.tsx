
import React, { useState, useMemo } from 'react';
import { Dictionary, DictionaryKey, KeyKind } from '../../contract/types';

interface KeyPickerProps {
  dictionaries: Dictionary[];
  selectedKeyId: string | null;
  onSelect: (keyId: string) => void;
  className?: string;
  filterKind?: KeyKind;
}

export const KeyPicker: React.FC<KeyPickerProps> = ({ 
  dictionaries, 
  selectedKeyId, 
  onSelect,
  className = "",
  filterKind
}) => {
  const [search, setSearch] = useState("");
  const [selectedDictId, setSelectedDictId] = useState<string>("all");

  const allKeys = useMemo(() => {
    const keys: (DictionaryKey & { dictId: string; dictName: string; isBuiltin: boolean })[] = [];
    dictionaries.forEach(d => {
      const isBuiltin = d.dictionaryId.startsWith('canon.');
      d.keys.forEach(k => {
        if (filterKind && k.kind !== filterKind) return;
        keys.push({ 
          ...k, 
          dictId: d.dictionaryId, 
          dictName: d.dictionaryId.split('.').slice(-1)[0].toUpperCase(),
          isBuiltin
        });
      });
    });
    return keys;
  }, [dictionaries, filterKind]);

  const filteredKeys = useMemo(() => {
    const s = search.toLowerCase();
    return allKeys.filter(k => {
      const matchesSearch = k.alias.toLowerCase().includes(s) || k.path.toLowerCase().includes(s);
      const matchesDict = selectedDictId === "all" || k.dictId === selectedDictId;
      return matchesSearch && matchesDict;
    });
  }, [allKeys, search, selectedDictId]);

  const selectedKey = useMemo(() => 
    allKeys.find(k => k.keyId === selectedKeyId),
    [allKeys, selectedKeyId]
  );

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input 
            type="text" 
            placeholder="Search all dictionaries..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:border-blue-500 outline-none pr-8 placeholder:text-zinc-700"
          />
          <div className="absolute right-3 top-2.5 text-zinc-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>
        <select 
          value={selectedDictId}
          onChange={(e) => setSelectedDictId(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] text-zinc-400 font-bold outline-none focus:border-blue-500 max-w-[100px]"
        >
          <option value="all">All Sources</option>
          {dictionaries.map(d => (
            <option key={d.dictionaryId} value={d.dictionaryId}>{d.dictionaryId.split('.').slice(-1)[0]}</option>
          ))}
        </select>
      </div>

      <div className="max-h-[220px] overflow-y-auto border border-zinc-800 rounded bg-black/40 scrollbar-thin scrollbar-thumb-zinc-800">
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
                <span className={`text-[8px] px-1 py-0.5 rounded font-black uppercase tracking-tighter ${k.isBuiltin ? 'bg-blue-900/30 text-blue-500' : 'bg-zinc-800 text-zinc-500'}`}>
                  {k.dictName}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] text-zinc-600 font-mono truncate">{k.path}</span>
                {k.tags?.slice(0, 1).map(t => (
                  <span key={t} className="text-[7px] text-zinc-700 uppercase">#{t}</span>
                ))}
              </div>
            </button>
          ))
        ) : (
          <div className="p-4 text-center text-[10px] text-zinc-600 italic">No keys found</div>
        )}
      </div>

      {selectedKey && (
        <div className="p-2 bg-blue-500/5 border border-blue-500/20 rounded-lg flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[8px] text-blue-500/60 uppercase font-black tracking-widest">Active Connection</span>
            <span className="text-[10px] text-blue-400 font-bold">{selectedKey.alias}</span>
          </div>
          <button 
            onClick={() => onSelect("")}
            className="p-1.5 hover:bg-red-500/10 rounded-md text-zinc-600 hover:text-red-400 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      )}
    </div>
  );
};

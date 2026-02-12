
import React, { useState, useEffect, useMemo } from 'react';
import { useDataStore } from './store/useDataStore';
import { resolvePath, normalizeValue } from './engine-logic';
// Fix: Import Dictionary and DictionaryKey from contract types as they are defined there, not in shared types.
import { DictionaryItem } from '../../shared/types';
import { Dictionary, DictionaryKey } from '../../contract/types';

export const DataDictionaryBrowser: React.FC = () => {
  const { 
    availableAdapters, 
    activeAdapterId, 
    setActiveAdapter, 
    liveSnapshot, 
    refreshSnapshot,
    builtinDictionaries,
    importedDictionaries
  } = useDataStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const interval = setInterval(refreshSnapshot, 5000);
    return () => clearInterval(interval);
  }, [activeAdapterId]);

  const allDictionaries = useMemo(() => [...builtinDictionaries, ...importedDictionaries], [builtinDictionaries, importedDictionaries]);

  // Fix: Explicitly typing the results object ensures that the keys variable in the map function has a defined type (DictionaryKey[]) instead of unknown.
  const groupedKeys = useMemo((): Record<string, DictionaryKey[]> => {
    const results: Record<string, DictionaryKey[]> = {};
    const s = search.toLowerCase();

    allDictionaries.forEach((dict: Dictionary) => {
      dict.keys.forEach((key: DictionaryKey) => {
        if (key.alias.toLowerCase().includes(s) || key.path.toLowerCase().includes(s)) {
          const category = `${dict.dictionaryId.split('.').slice(-1)[0]} > ${key.scope}`;
          if (!results[category]) results[category] = [];
          results[category].push(key);
        }
      });
    });

    return results;
  }, [allDictionaries, search]);

  return (
    <div className="w-[320px] h-full bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">
      <div className="p-4 border-b border-zinc-800 space-y-4 bg-zinc-900/50">
        <div className="flex flex-col gap-1">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Provider</h3>
          <select 
            value={activeAdapterId}
            onChange={(e) => setActiveAdapter(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-xs text-blue-400 font-bold focus:border-blue-500 outline-none cursor-pointer"
          >
            {availableAdapters.map(adapter => (
              <option key={adapter.id} value={adapter.id}>{adapter.name}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <input 
            type="text" 
            placeholder="Search keys in all dictionaries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:border-blue-500 outline-none pr-8"
          />
          <div className="absolute right-3 top-2.5 text-zinc-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-800">
        {Object.entries(groupedKeys).map(([category, keys]) => (
          <div key={category} className="mb-4">
            <div className="flex items-center gap-2 px-2 py-1 mb-1">
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{category}</span>
            </div>
            
            <div className="space-y-0.5 ml-2">
              {/* Fix: Casting keys to DictionaryKey[] to resolve "Property 'map' does not exist on type 'unknown'" error at runtime or compile time. */}
              {(keys as DictionaryKey[]).map((key) => {
                const liveValue = resolvePath(liveSnapshot, key.path);
                const displayValue = normalizeValue(liveValue, key.dataType);

                return (
                  <div 
                    key={key.keyId}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/renderless-field', JSON.stringify(key));
                    }}
                    className="group relative flex flex-col p-2.5 rounded hover:bg-zinc-800 cursor-grab active:cursor-grabbing transition-all border border-transparent hover:border-zinc-700/50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm bg-blue-500/10 text-blue-500 flex items-center justify-center text-[8px] font-black">
                          {key.dataType.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-zinc-300 font-medium leading-none">{key.alias}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-blue-400/80 tracking-tight">
                          {displayValue}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] text-zinc-600 font-mono truncate max-w-[150px]">
                        {key.path}
                      </span>
                      <span className="text-[8px] text-zinc-700 font-bold uppercase tracking-tighter">Drag to Bind</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

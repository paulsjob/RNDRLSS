
import React, { useState, useEffect, useMemo } from 'react';
import { useDataStore } from './store/useDataStore';
import { resolvePath, normalizeValue } from './engine-logic';
import { DictionaryItem } from '../../shared/types';

export const DataDictionaryBrowser: React.FC = () => {
  const { availableAdapters, activeAdapterId, setActiveAdapter, dictionary, liveSnapshot, refreshSnapshot } = useDataStore();
  const [search, setSearch] = useState('');

  // Auto-refresh snapshot periodically to simulate live data
  useEffect(() => {
    const interval = setInterval(refreshSnapshot, 5000);
    return () => clearInterval(interval);
  }, [activeAdapterId]);

  // Group dictionary by category
  // Fixed: Added explicit type to useMemo and reduce to ensure groupedDictionary and its values are correctly typed.
  const groupedDictionary = useMemo<Record<string, DictionaryItem[]>>(() => {
    const filtered = dictionary.filter(item => 
      item.key.toLowerCase().includes(search.toLowerCase()) || 
      item.category.toLowerCase().includes(search.toLowerCase())
    );

    return filtered.reduce<Record<string, DictionaryItem[]>>((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [dictionary, search]);

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
            placeholder="Search data dictionary..."
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
        {Object.entries(groupedDictionary).map(([category, items]) => (
          <div key={category} className="mb-4">
            <div className="flex items-center gap-2 px-2 py-1 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600"><path d="m6 9 6 6 6-6"/></svg>
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{category}</span>
            </div>
            
            <div className="space-y-0.5 ml-2">
              {/* Fixed: Ensure items is recognized as DictionaryItem[] to allow mapping */}
              {items.map((item: DictionaryItem) => {
                const liveValue = resolvePath(liveSnapshot, item.providerPath);
                const displayValue = normalizeValue(liveValue, item.dataType);

                return (
                  <div 
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/renderless-field', JSON.stringify(item));
                    }}
                    className="group relative flex flex-col p-2.5 rounded hover:bg-zinc-800 cursor-grab active:cursor-grabbing transition-all border border-transparent hover:border-zinc-700/50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-black
                          ${item.dataType === 'number' ? 'bg-amber-500/10 text-amber-500' : 
                            item.dataType === 'string' ? 'bg-blue-500/10 text-blue-500' : 
                            item.dataType === 'percentage' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-400'}
                        `}>
                          {item.dataType === 'number' ? '#' : item.dataType === 'string' ? 'T' : item.dataType === 'percentage' ? '%' : 'V'}
                        </div>
                        <span className="text-xs text-zinc-300 font-medium leading-none">{item.key}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-blue-400/80 tracking-tight">
                          {displayValue}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-blue-500/40 animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] text-zinc-600 font-mono truncate max-w-[150px]">
                        {item.providerPath}
                      </span>
                      <span className="text-[8px] text-zinc-700 font-bold uppercase tracking-tighter">Drag to Bind</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {Object.keys(groupedDictionary).length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4 text-zinc-600">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            <p className="text-xs text-zinc-500 font-medium px-8">No fields matching your search in the current provider dictionary.</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-zinc-950/50 border-t border-zinc-800 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[9px] text-zinc-600 uppercase font-black">Feed Status</span>
          <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Connected</span>
        </div>
        <button 
          onClick={() => refreshSnapshot()}
          className="p-1.5 rounded-lg border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
        </button>
      </div>
    </div>
  );
};

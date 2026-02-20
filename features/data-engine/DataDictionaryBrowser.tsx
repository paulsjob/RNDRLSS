
import React, { useState, useEffect, useMemo } from 'react';
import { useDataStore, getProvenance, Provenance } from './store/useDataStore';
import { resolvePath, normalizeValue } from './engine-logic';
import { Dictionary, DictionaryKey } from '../../contract/types';

const ProvenanceBadge: React.FC<{ origin: Provenance }> = ({ origin }) => {
  const colors = {
    LIVE: 'bg-green-500/10 text-green-500 border-green-500/20',
    SIM: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    MANUAL: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    STALE: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
    INVALID: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  return (
    <span className={`text-[7px] font-black px-1 py-0.5 rounded border uppercase tracking-tighter ml-2 ${(colors as any)[origin]}`}>
      {origin}
    </span>
  );
};

const KeyPreviewTooltip: React.FC<{ value: any; label: string; x: number; y: number; origin: Provenance }> = ({ value, label, x, y, origin }) => (
  <div 
    className="fixed z-[100] bg-zinc-900 border border-blue-500/50 rounded-xl px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.8)] pointer-events-none animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1 min-w-[140px]"
    style={{ left: x + 15, top: y - 20 }}
  >
    <div className="flex items-center justify-between gap-4">
      <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{label}</span>
      <ProvenanceBadge origin={origin} />
    </div>
    <span className="text-xl font-mono font-black text-white leading-none">
      {value !== undefined ? (typeof value === 'object' ? '{...}' : String(value)) : '---'}
    </span>
    <div className="flex items-center gap-1.5 mt-1 opacity-50">
       <div className={`w-1.5 h-1.5 rounded-full ${origin === 'LIVE' ? 'bg-green-500' : 'bg-zinc-500'} animate-pulse`}></div>
       <span className="text-[8px] font-bold text-zinc-400 uppercase">Bus Reality Trace</span>
    </div>
  </div>
);

export const DataDictionaryBrowser: React.FC = () => {
  const { 
    availableAdapters, 
    activeAdapterId, 
    setActiveAdapter, 
    liveSnapshot, 
    refreshSnapshot,
    builtinDictionaries,
    importedDictionaries,
    isTruthMode,
    selection,
    setSelection,
    setWiringMode,
    simController,
    validation
  } = useDataStore();
  
  const [search, setSearch] = useState('');
  const [hoveredKey, setHoveredKey] = useState<{ key: DictionaryKey; x: number; y: number } | null>(null);

  // ITEM 34: Derived step for highlighting
  const currentStep = useMemo(() => {
    if (simController.status === 'idle') return 1;
    if (selection.id === null) return 2;
    if (validation.status !== 'pass') return 3;
    if (!isTruthMode) return 4;
    return 5;
  }, [simController.status, selection.id, validation.status, isTruthMode]);

  useEffect(() => {
    const interval = setInterval(refreshSnapshot, 5000);
    return () => clearInterval(interval);
  }, [activeAdapterId]);

  const allDictionaries = useMemo(() => [...builtinDictionaries, ...importedDictionaries], [builtinDictionaries, importedDictionaries]);

  const groupedKeys = useMemo((): Record<string, DictionaryKey[]> => {
    const results: Record<string, DictionaryKey[]> = {};
    const s = search.toLowerCase();

    allDictionaries.forEach((dict: Dictionary) => {
      dict.keys.forEach((key: DictionaryKey) => {
        if (key.alias.toLowerCase().includes(s) || (key.path || '').toLowerCase().includes(s)) {
          const category = `${dict.dictionaryId.split('.').slice(-1)[0]} > ${key.scope}`;
          if (!results[category]) results[category] = [];
          results[category].push(key);
        }
      });
    });

    return results;
  }, [allDictionaries, search]);

  return (
    <div className={`w-[320px] h-full border-r flex flex-col shrink-0 relative transition-all duration-500 ${isTruthMode ? 'bg-black border-blue-900/40' : 'bg-zinc-900 border-zinc-800'} ${currentStep === 2 ? 'ring-inset ring-1 ring-blue-500/30 bg-blue-500/5' : ''}`}>
      {/* Flow Indicator */}
      <div className="absolute top-3 left-4 z-10 pointer-events-none">
        <div className={`flex items-center gap-2 px-2 py-1 border rounded-md backdrop-blur-md transition-all ${isTruthMode ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-500'}`}>
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">{isTruthMode ? 'Reality Source' : '1. Data Sources'}</span>
        </div>
      </div>

      <div className={`p-4 pt-12 border-b space-y-4 transition-all duration-500 ${isTruthMode ? 'bg-blue-950/10 border-blue-900/20' : 'bg-zinc-900/50 border-zinc-800'}`}>
        <div className={`flex flex-col gap-1 transition-opacity ${isTruthMode ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Provider</h3>
            <span className="text-[8px] text-zinc-700 font-mono">STEP 1</span>
          </div>
          <select 
            value={activeAdapterId}
            onChange={(e) => setActiveAdapter(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-xs text-blue-400 font-bold outline-none cursor-pointer"
          >
            {availableAdapters.map(adapter => (
              <option key={adapter.id} value={adapter.id}>{adapter.name}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <input 
            type="text" 
            placeholder="Filter reality registry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full bg-black border rounded px-3 py-2 text-xs focus:border-blue-500 outline-none pr-8 transition-colors ${isTruthMode ? 'border-blue-900/40 text-blue-100 placeholder:text-blue-900' : 'border-zinc-800 text-zinc-300'} ${currentStep === 2 ? 'highlight-guide' : ''}`}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-zinc-800">
        {Object.entries(groupedKeys).map(([category, keys]) => (
          <div key={category} className="mb-4">
            <div className="flex items-center gap-2 px-2 py-1 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isTruthMode ? 'text-blue-900' : 'text-zinc-600'}`}>{category}</span>
            </div>
            
            <div className="space-y-0.5 ml-2">
              {(keys as DictionaryKey[]).map((key) => {
                const liveValue = resolvePath(liveSnapshot, key.path || '');
                const displayValue = normalizeValue(liveValue, key.dataType);
                const isSelected = selection.id === key.keyId;

                return (
                  <div 
                    key={key.keyId}
                    draggable={!isTruthMode}
                    onClick={() => isTruthMode && setSelection('key', key.keyId, key.alias, key.canonicalPath)}
                    onDragStart={(e) => {
                      if (isTruthMode) return;
                      e.dataTransfer.setData('application/renderless-field', JSON.stringify(key));
                      setWiringMode(true, { id: key.keyId, type: 'key', label: key.alias });
                    }}
                    onDragEnd={() => !isTruthMode && setWiringMode(false)}
                    onMouseEnter={(e) => {
                       setHoveredKey({ key, x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => setHoveredKey(null)}
                    className={`group relative flex flex-col p-2.5 rounded transition-all border cursor-pointer ${
                      isSelected ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)] z-10' : 
                      isTruthMode ? 'border-transparent hover:bg-blue-500/5 hover:border-blue-900/30' : 
                      'border-transparent hover:bg-zinc-800 hover:border-zinc-700/50'
                    } ${currentStep === 2 ? 'hover:border-blue-400/40' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-black transition-colors ${isSelected ? 'bg-blue-500 text-white' : 'bg-blue-500/10 text-blue-500'}`}>
                          {key.dataType.charAt(0).toUpperCase()}
                        </div>
                        <span className={`text-xs font-medium leading-none truncate transition-colors ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{key.alias}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono font-bold tracking-tight ${isSelected ? 'text-white' : 'text-blue-400/80'}`}>
                          {displayValue}
                        </span>
                      </div>
                    </div>
                    {isTruthMode && (
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[8px] text-blue-900 font-mono truncate max-w-[150px]">{key.canonicalPath}</span>
                        <ProvenanceBadge origin={getProvenance(activeAdapterId)} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {hoveredKey && isTruthMode && (
        <KeyPreviewTooltip 
          label={hoveredKey.key.alias}
          value={resolvePath(liveSnapshot, hoveredKey.key.path || '')}
          origin={getProvenance(activeAdapterId)}
          x={hoveredKey.x}
          y={hoveredKey.y}
        />
      )}
    </div>
  );
};

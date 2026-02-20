
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { liveBus, LiveValueRecord } from '../../../shared/data-runtime';
import { mlbSimulator, MLB_SCENARIOS } from '../services/MLBSimulator';
import { MLB_CANON_DICTIONARY, MLB_KEYS } from '../../../contract/dictionaries/mlb';
import { Button } from '../../../shared/components/Button';
import { useDataStore, getProvenance, Provenance } from '../store/useDataStore';

type DensityMode = 'compact' | 'standard' | 'verbose';

const SourceSignalBadge: React.FC<{ origin: Provenance }> = ({ origin }) => {
  const colors = {
    LIVE: 'bg-green-600 text-white',
    SIM: 'bg-blue-600 text-white',
    MANUAL: 'bg-amber-600 text-white',
    PIPELINE: 'bg-purple-600 text-white',
    STALE: 'bg-zinc-800 text-zinc-500',
    INVALID: 'bg-red-600 text-white',
    UNKNOWN: 'bg-zinc-900 text-zinc-700 border border-zinc-800'
  };

  return (
    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm ${colors[origin] || colors.UNKNOWN}`}>
      {origin}
    </span>
  );
};

const StalenessTicker: React.FC<{ ts?: number }> = ({ ts }) => {
  const [now, setNow] = useState(Date.now());
  
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!ts) return null;
  const diff = (now - ts) / 1000;
  const isStale = diff > 10;

  return (
    <div className="flex items-center gap-1">
      <span className={`text-[8px] font-mono tabular-nums ${isStale ? 'text-red-500 font-bold' : 'text-zinc-600'}`}>
        {diff < 1 ? '<1s' : `${diff.toFixed(0)}s`}
      </span>
      {isStale && (
        <span className="text-[6px] font-black text-red-500 uppercase tracking-tighter border border-red-500/30 px-0.5 rounded bg-red-500/5">Stale</span>
      )}
    </div>
  );
};

const LiveStateRow: React.FC<{ keyInfo: any; record: LiveValueRecord | null; mode: DensityMode }> = ({ keyInfo, record, mode }) => {
  const { isTruthMode, setSelection, selection, monitor, togglePin } = useDataStore();
  const [isPulsing, setIsPulsing] = useState(false);
  const lastSeq = useRef(record?.seq || 0);

  useEffect(() => {
    if (record && record.seq !== lastSeq.current) {
      lastSeq.current = record.seq;
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 800);
      return () => clearTimeout(timer);
    }
  }, [record]);

  const origin = getProvenance(record?.sourceId, record?.ts);
  const isSelected = selection.id === keyInfo.keyId;
  const isPinned = monitor.pinnedKeyIds.has(keyInfo.keyId);

  const hasData = !!record;

  return (
    <div 
      onClick={() => isTruthMode && setSelection('key', keyInfo.keyId, keyInfo.alias, keyInfo.canonicalPath)}
      className={`relative flex items-center justify-between p-2.5 rounded-xl transition-all duration-300 group cursor-pointer border ${
        isSelected ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 
        isPulsing ? 'bg-blue-500/5 border-blue-500/30' : 
        'bg-black/20 border-zinc-800/40 hover:bg-zinc-800/20 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <button 
          onClick={(e) => { e.stopPropagation(); togglePin(keyInfo.keyId); }}
          className={`shrink-0 transition-colors ${isPinned ? 'text-blue-400' : 'text-zinc-800 group-hover:text-zinc-600'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </button>

        <div className="flex flex-col gap-0.5 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-tight truncate transition-colors ${isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
              {keyInfo.alias}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SourceSignalBadge origin={origin} />
            {mode === 'verbose' && (
               <span className="text-[7px] text-zinc-700 font-mono truncate max-w-[120px]">{keyInfo.canonicalPath}</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-right flex flex-col items-end shrink-0 pl-4">
        <span className={`text-[13px] font-mono font-black tabular-nums transition-colors ${hasData ? (origin === 'STALE' ? 'text-zinc-600' : 'text-blue-400') : 'text-zinc-800'}`}>
          {hasData ? (typeof record!.value === 'boolean' ? (record!.value ? 'TRUE' : 'FALSE') : String(record!.value)) : '---'}
        </span>
        <StalenessTicker ts={record?.ts} />
      </div>
    </div>
  );
};

export const LiveMonitor: React.FC = () => {
  const { 
    simController, 
    transportStop,
    transportPause,
    setSimMode,
    transportStart,
    resetToCleanStart,
    busState, 
    isTruthMode, 
    monitor,
    toggleSection,
    setMonitorSearch,
    setMonitorFilter
  } = useDataStore();
  
  const [density, setDensity] = useState<DensityMode>('standard');
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = liveBus.subscribeAll(() => setTick(t => t + 1));
    return unsub;
  }, []);

  const handleStep = () => mlbSimulator.step();

  const allKeys = MLB_CANON_DICTIONARY.keys.filter(k => k.kind === 'state');
  
  const filteredKeys = useMemo(() => {
    let list = allKeys;
    if (monitor.searchQuery) {
      const q = monitor.searchQuery.toLowerCase();
      list = list.filter(k => k.alias.toLowerCase().includes(q) || k.canonicalPath.toLowerCase().includes(q));
    }
    if (monitor.filterType === 'pinned') {
      list = list.filter(k => monitor.pinnedKeyIds.has(k.keyId));
    } else if (monitor.filterType === 'recent') {
      list = list.filter(k => {
        const record = liveBus.getValue(k.keyId);
        return record && Date.now() - record.ts < 15000;
      });
    }
    return list;
  }, [allKeys, monitor, liveBus.getVersion()]);

  const groups = useMemo(() => {
    const map: Record<string, typeof filteredKeys> = {};
    filteredKeys.forEach(k => {
      const g = k.scope || 'General';
      if (!map[g]) map[g] = [];
      map[g].push(k);
    });
    return map;
  }, [filteredKeys]);

  const pinnedKeysList = useMemo(() => 
    allKeys.filter(k => monitor.pinnedKeyIds.has(k.keyId)),
    [allKeys, monitor.pinnedKeyIds]
  );

  const isSimRunning = simController.status === 'running';

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-zinc-950">
      {/* VTR Controller Bar - Integrated into Header in ITEM 39, but keeping local indicators */}
      <div className={`p-4 pt-12 border-b sticky top-0 z-20 space-y-4 shadow-xl transition-all duration-500 ${isTruthMode ? 'bg-blue-900/10 border-blue-500/40 backdrop-blur-xl' : 'bg-zinc-900/90 border-zinc-800 backdrop-blur-md'}`}>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isTruthMode ? 'bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,1)] animate-pulse' : isSimRunning ? 'bg-blue-500 animate-pulse' : 'bg-zinc-700'}`}></div>
              <h3 className={`text-[12px] font-black uppercase tracking-widest ${isTruthMode ? 'text-blue-400' : 'text-zinc-100'}`}>
                {isTruthMode ? 'Diagnostic Reality' : 'Story Control'}
              </h3>
            </div>
            <span className={`text-[8px] font-mono tracking-tighter mt-1 uppercase ${isTruthMode ? 'text-blue-500/60' : 'text-zinc-600'}`}>
              {isTruthMode ? 'READ-ONLY REALITY MODE' : `${simController.status.toUpperCase()} | ${simController.mode || 'STANDBY'}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex bg-black border border-zinc-800 rounded-lg p-1 gap-1 transition-all ${isTruthMode ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
              <button onClick={transportPause} className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${isSimRunning ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' : 'bg-zinc-800 text-zinc-500'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>
              </button>
              <button onClick={handleStep} className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 8 4 4-4 4"/><path d="M2 12h20"/></svg>
              </button>
              <button onClick={transportStop} className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 text-red-500 hover:bg-red-500/20 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect width="12" height="12" x="6" y="6" rx="2"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar (ITEM 37) */}
        <div className="flex flex-col gap-3">
           <div className="relative">
              <input 
                type="text" 
                placeholder="Search live signals..." 
                value={monitor.searchQuery}
                onChange={(e) => setMonitorSearch(e.target.value)}
                className="w-full bg-black/60 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white focus:border-blue-500 outline-none pr-10 placeholder:text-zinc-700 font-medium transition-all"
              />
              <div className="absolute right-4 top-2.5 text-zinc-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
           </div>
           <div className="flex gap-1 p-1 bg-black/40 border border-zinc-800 rounded-lg">
              {(['all', 'pinned', 'recent'] as const).map(f => (
                <button 
                  key={f}
                  onClick={() => setMonitorFilter(f)}
                  className={`flex-1 py-1 rounded text-[9px] font-black uppercase tracking-widest transition-all ${monitor.filterType === f ? 'bg-zinc-800 text-blue-400' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                  {f}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800">
        
        {/* Pinned Section (ITEM 37) */}
        {pinnedKeysList.length > 0 && monitor.filterType !== 'pinned' && (
          <section className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex items-center gap-2 px-1">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Pinned Signals</span>
              <div className="h-px flex-1 bg-blue-500/20"></div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {pinnedKeysList.map(key => (
                <LiveStateRow 
                  key={key.keyId} 
                  keyInfo={key} 
                  record={liveBus.getValue(key.keyId)} 
                  mode={density} 
                />
              ))}
            </div>
          </section>
        )}

        {/* Grouped Registry (ITEM 37) */}
        <section className="space-y-4">
          {Object.entries(groups).map(([section, keys]) => {
            const isCollapsed = monitor.collapsedSections.has(section);
            return (
              <div key={section} className="space-y-2">
                <button 
                  onClick={() => toggleSection(section)}
                  className="w-full flex items-center justify-between px-1 group"
                >
                   <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${isCollapsed ? 'text-zinc-700' : 'text-zinc-500 group-hover:text-zinc-300'}`}>{section}</span>
                    <div className={`h-px w-8 transition-colors ${isCollapsed ? 'bg-zinc-900' : 'bg-zinc-800'}`}></div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`text-zinc-800 group-hover:text-zinc-600 transition-transform ${isCollapsed ? '-rotate-90' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
                </button>

                {!isCollapsed && (
                  <div className="grid grid-cols-1 gap-2 animate-in fade-in duration-300">
                    {(keys as any[]).map(key => (
                      <LiveStateRow 
                        key={key.keyId} 
                        keyInfo={key} 
                        record={liveBus.getValue(key.keyId)} 
                        mode={density} 
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {!isTruthMode && monitor.filterType === 'all' && (
          <section className="space-y-4 pt-12 border-t border-zinc-900 opacity-40 hover:opacity-100 transition-opacity">
            <div className="flex justify-between items-center ml-1">
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block">Simulation Control</span>
              <button onClick={resetToCleanStart} className="text-[9px] font-black text-blue-400 hover:underline uppercase tracking-widest">Reset Demo</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MLB_SCENARIOS.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => {
                    setSimMode('scenario', s.id);
                    transportStart();
                  }} 
                  className={`flex flex-col text-left p-3 border rounded-xl transition-all group ${simController.activeScenarioId === s.id ? 'bg-blue-600/20 border-blue-500' : 'bg-black/40 border-zinc-800 hover:bg-zinc-800 hover:border-blue-500/30'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{s.icon}</span>
                    <span className={`text-[10px] font-black uppercase tracking-tight ${simController.activeScenarioId === s.id ? 'text-blue-400' : 'text-zinc-300'}`}>{s.label}</span>
                  </div>
                  <p className="text-[8px] text-zinc-600 font-medium leading-tight">{s.description}</p>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className={`p-3 border-t flex items-center justify-between sticky bottom-0 z-20 transition-all duration-500 ${isTruthMode ? 'bg-black border-blue-900/50' : 'bg-zinc-900 border-zinc-800'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${busState === 'streaming' ? 'bg-green-500' : 'bg-zinc-800'}`}></div>
          <span className={`text-[9px] font-black uppercase tracking-[0.1em] ${isTruthMode ? 'text-blue-500' : 'text-zinc-500'}`}>
            {isTruthMode ? 'REALITY PROOF ACTIVE' : `Distribution: ${busState.toUpperCase()}`}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black text-zinc-700 uppercase">Signals:</span>
          <span className="text-[10px] font-mono font-bold text-blue-400">{filteredKeys.length} active</span>
        </div>
      </div>
    </div>
  );
};

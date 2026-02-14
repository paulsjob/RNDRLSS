
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { liveBus, LiveValueRecord } from '../../../shared/data-runtime';
import { mlbSimulator, MLB_SCENARIOS } from '../services/MLBSimulator';
import { MLB_CANON_DICTIONARY, MLB_KEYS } from '../../../contract/dictionaries/mlb';
import { Button } from '../../../shared/components/Button';
import { useDataStore, getProvenance, Provenance } from '../store/useDataStore';

type DensityMode = 'compact' | 'standard' | 'verbose';

const ProvenanceBadge: React.FC<{ origin: Provenance }> = ({ origin }) => {
  const colors = {
    LIVE: 'bg-green-500/10 text-green-500 border-green-500/20',
    SIM: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    MANUAL: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    STALE: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
    INVALID: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <span className={`text-[7px] font-black px-1 py-0.5 rounded border uppercase tracking-tighter transition-all duration-300 ${colors[origin]}`}>
      {origin}
    </span>
  );
};

const LiveStateRow: React.FC<{ keyInfo: any; record: LiveValueRecord | null; mode: DensityMode }> = ({ keyInfo, record, mode }) => {
  const { isTruthMode, setTraceId, selectedTraceId } = useDataStore();
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
  const isSelected = selectedTraceId === keyInfo.keyId;

  const staleLimit = 15000;
  const isStale = record ? (Date.now() - record.ts > staleLimit) : true;
  const hasData = !!record;

  if (mode === 'compact') {
    return (
      <div 
        onClick={() => isTruthMode && setTraceId(isSelected ? null : keyInfo.keyId)}
        className={`flex flex-col items-center justify-center p-2 rounded-lg bg-black/40 border transition-all duration-500 cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.3)] scale-105 z-10' : isPulsing ? 'border-blue-500/60 bg-blue-500/5' : 'border-zinc-800/40'}`}
        title={keyInfo.alias}
      >
        <span className={`text-[13px] font-mono font-black ${hasData ? (isStale ? 'text-zinc-500' : 'text-blue-400') : 'text-zinc-800'}`}>
          {hasData ? (typeof record!.value === 'boolean' ? (record!.value ? 'T' : 'F') : String(record!.value)) : '—'}
        </span>
        <span className="text-[7px] text-zinc-600 font-bold uppercase tracking-tighter truncate w-full text-center">{keyInfo.alias}</span>
        {isTruthMode && <div className="mt-1"><ProvenanceBadge origin={origin} /></div>}
      </div>
    );
  }

  return (
    <div 
      onClick={() => isTruthMode && setTraceId(isSelected ? null : keyInfo.keyId)}
      className={`relative flex items-center justify-between p-3 rounded-xl bg-black/30 border transition-all duration-500 group cursor-pointer ${
        isSelected ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : isPulsing ? 'border-blue-500/40 bg-blue-500/5' : 'border-zinc-800/40 hover:bg-zinc-800/20'
      }`}
    >
      <div className="flex flex-col gap-0.5 overflow-hidden">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
            !hasData ? 'bg-zinc-800' : 
            isStale ? 'bg-amber-500' : 
            'bg-green-500'
          }`}></div>
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight group-hover:text-zinc-300 transition-colors">
            {keyInfo.alias}
          </span>
          {isTruthMode && <ProvenanceBadge origin={origin} />}
        </div>
        {mode === 'verbose' && (
          <span className="text-[8px] text-zinc-700 font-mono uppercase tracking-tighter truncate max-w-[180px]">
            {keyInfo.canonicalPath}
          </span>
        )}
      </div>
      
      <div className="text-right flex flex-col items-end">
        <span className={`text-[12px] font-mono font-black transition-colors ${hasData ? (isStale ? 'text-zinc-500' : 'text-blue-400') : 'text-zinc-800'}`}>
          {hasData ? (typeof record!.value === 'boolean' ? (record!.value ? 'TRUE' : 'FALSE') : String(record!.value)) : '---'}
        </span>
        {mode === 'verbose' && hasData && (
          <div className="flex items-center gap-1.5 mt-0.5 opacity-60">
            <span className="text-[7px] text-zinc-600 font-mono">SEQ:{record!.seq % 1000}</span>
            <span className="text-[7px] text-zinc-600 font-mono">{(Date.now() - record!.ts) / 1000}s</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const LiveMonitor: React.FC = () => {
  const { simState, setSimState, busState, isTruthMode, nodes } = useDataStore();
  const [density, setDensity] = useState<DensityMode>('standard');
  const [lastMsg, setLastMsg] = useState<any>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = liveBus.subscribeAll((msg) => {
      setLastMsg(msg);
      setTick(t => t + 1);
    });
    return unsub;
  }, []);

  const handleStart = () => {
    mlbSimulator.start();
    setSimState('playing');
  };

  const handlePause = () => {
    mlbSimulator.stop();
    setSimState('paused');
  };

  const handleStop = () => {
    mlbSimulator.stop();
    setSimState('stopped');
  };

  const handleStep = () => {
    mlbSimulator.step();
    if (simState === 'stopped') setSimState('paused');
  };

  const applyScenario = (id: string) => {
    mlbSimulator.applyScenario(id);
    if (simState === 'stopped') setSimState('paused');
  };

  const eventRecord = liveBus.getValue(MLB_KEYS.GAME_EVENTS);
  const events = Array.isArray(eventRecord?.value) ? [...eventRecord!.value].reverse() : [];

  const onAirKeys = useMemo(() => {
    return MLB_CANON_DICTIONARY.keys.filter(k => {
      const record = liveBus.getValue(k.keyId);
      return record && Date.now() - record.ts < 30000;
    });
  }, [nodes, lastMsg]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-zinc-950">
      {/* VTR Controller Bar / Truth Indicator */}
      <div className={`p-4 pt-12 border-b sticky top-0 z-20 space-y-4 shadow-xl transition-all duration-500 ${isTruthMode ? 'bg-blue-900/10 border-blue-500/40 backdrop-blur-xl' : 'bg-zinc-900/90 border-zinc-800 backdrop-blur-md'}`}>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isTruthMode ? 'bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,1)] animate-pulse' : simState === 'playing' ? 'bg-blue-500 animate-pulse' : 'bg-zinc-700'}`}></div>
              <h3 className={`text-[12px] font-black uppercase tracking-widest ${isTruthMode ? 'text-blue-400' : 'text-zinc-100'}`}>
                {isTruthMode ? 'Diagnostic Reality' : 'Story Control'}
              </h3>
            </div>
            <span className={`text-[8px] font-mono tracking-tighter mt-1 uppercase ${isTruthMode ? 'text-blue-500/60' : 'text-zinc-600'}`}>
              {isTruthMode ? 'READ-ONLY REALITY MODE' : `${simState.toUpperCase()} MODE | CLUSTER ALPHA`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex bg-black border border-zinc-800 rounded-lg p-1 gap-1 transition-all ${isTruthMode ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
              <button onClick={simState === 'playing' ? handlePause : handleStart} className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${simState === 'playing' ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' : 'bg-blue-600 text-white'}`}>
                {simState === 'playing' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="m7 4 12 8-12 8V4z"/></svg>
                )}
              </button>
              <button onClick={handleStep} className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 8 4 4-4 4"/><path d="M2 12h20"/></svg>
              </button>
            </div>

            <div className="flex bg-black/50 border border-zinc-800 rounded-lg p-1">
              {(['compact', 'standard', 'verbose'] as DensityMode[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDensity(d)}
                  className={`w-7 h-7 flex items-center justify-center text-[10px] font-black uppercase rounded transition-all ${density === d ? 'bg-zinc-800 text-blue-400' : 'text-zinc-700 hover:text-zinc-500'}`}
                >
                  {d.charAt(0)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isTruthMode ? (
          <div className="bg-black/50 border border-blue-500/20 rounded-xl p-4 animate-in fade-in duration-500">
             <div className="flex items-center justify-between mb-3 border-b border-blue-500/10 pb-2">
               <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">On-Air Reality Snapshot</h4>
               <span className="text-[8px] text-zinc-600 font-mono">ALL CHANNELS</span>
             </div>
             <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {onAirKeys.slice(0, 6).map(k => {
                  const record = liveBus.getValue(k.keyId);
                  const provenance = getProvenance(record?.sourceId, record?.ts);
                  return (
                    <div key={k.keyId} className="flex items-center justify-between group">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`w-1 h-1 rounded-full ${provenance === 'LIVE' ? 'bg-green-500' : 'bg-zinc-600'}`}></div>
                        <span className="text-[9px] text-zinc-400 font-bold uppercase truncate">{k.alias}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-300 font-black">{record?.value ?? '---'}</span>
                    </div>
                  );
                })}
             </div>
             <div className="mt-4 flex items-center gap-2">
                <span className="text-[8px] text-zinc-600 uppercase font-black">Downstream Consumers:</span>
                <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-black border border-blue-500/20">Design Stage Alpha</span>
                <span className="text-[8px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-black border border-green-500/20">Social Feed Edge</span>
             </div>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block ml-1">Live Story Scenarios</span>
            <div className="grid grid-cols-2 gap-2">
              {MLB_SCENARIOS.map(s => (
                <button key={s.id} onClick={() => applyScenario(s.id)} className="flex flex-col text-left p-3 bg-black/40 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:border-blue-500/30 transition-all group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{s.icon}</span>
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-tight">{s.label}</span>
                  </div>
                  <p className="text-[8px] text-zinc-600 font-medium leading-tight">{s.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800">
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{isTruthMode ? 'Live Registry Proof' : 'Registry State'}</span>
              <div className="h-px w-12 bg-zinc-800"></div>
            </div>
          </div>

          <div className={density === 'compact' ? 'grid grid-cols-4 gap-2' : 'grid grid-cols-1 gap-2'}>
            {MLB_CANON_DICTIONARY.keys.filter(k => k.kind === 'state').map(key => (
              <LiveStateRow 
                key={key.keyId} 
                keyInfo={key} 
                record={liveBus.getValue(key.keyId)} 
                mode={density} 
              />
            ))}
          </div>
        </section>

        {!isTruthMode && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between px-1">
               <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Producer Log</span>
                <div className="h-px w-12 bg-zinc-800"></div>
              </div>
            </div>

            <div className="space-y-2">
              {events.slice(0, 20).map((ev: any) => (
                <div key={ev.seq} className="bg-black/60 rounded-xl p-3 border border-zinc-800/60 flex justify-between items-center transition-all">
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] px-2 py-0.5 font-black rounded border uppercase tracking-widest ${ev.payload?.event === 'SCENARIO_LOADED' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                        {ev.payload?.event || 'DATA'}
                      </span>
                      <span className="text-[11px] text-zinc-100 font-bold tracking-tight truncate">{ev.payload?.scenario || ev.payload?.score || 'State Update'}</span>
                    </div>
                  </div>
                  <span className="text-[9px] text-zinc-700 font-mono">{new Date(ev.ts).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
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
      </div>
    </div>
  );
};

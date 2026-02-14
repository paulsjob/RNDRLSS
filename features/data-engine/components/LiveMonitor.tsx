
import React, { useState, useEffect, useRef } from 'react';
import { liveBus, LiveValueRecord } from '../../../shared/data-runtime';
import { mlbSimulator, MLB_SCENARIOS } from '../services/MLBSimulator';
import { MLB_CANON_DICTIONARY, MLB_KEYS } from '../../../contract/dictionaries/mlb';
import { Button } from '../../../shared/components/Button';
import { useDataStore } from '../store/useDataStore';

type DensityMode = 'compact' | 'standard' | 'verbose';

const LiveStateRow: React.FC<{ keyInfo: any; record: LiveValueRecord | null; mode: DensityMode }> = ({ keyInfo, record, mode }) => {
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

  const staleLimit = 15000;
  const isStale = record ? (Date.now() - record.ts > staleLimit) : true;
  const hasData = !!record;

  if (mode === 'compact') {
    return (
      <div 
        className={`flex flex-col items-center justify-center p-2 rounded-lg bg-black/40 border transition-all duration-500 ${isPulsing ? 'border-blue-500/60 bg-blue-500/5 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'border-zinc-800/40'}`}
        title={keyInfo.alias}
      >
        <span className={`text-[13px] font-mono font-black ${hasData ? (isStale ? 'text-zinc-500' : 'text-blue-400') : 'text-zinc-800'}`}>
          {hasData ? (typeof record!.value === 'boolean' ? (record!.value ? 'T' : 'F') : String(record!.value)) : '—'}
        </span>
        <span className="text-[7px] text-zinc-600 font-bold uppercase tracking-tighter truncate w-full text-center">{keyInfo.alias}</span>
      </div>
    );
  }

  return (
    <div 
      className={`relative flex items-center justify-between p-3 rounded-xl bg-black/30 border transition-all duration-500 group ${
        isPulsing ? 'border-blue-500/40 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'border-zinc-800/40 hover:bg-zinc-800/20'
      }`}
    >
      <div className="flex flex-col gap-0.5 overflow-hidden">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
            !hasData ? 'bg-zinc-800' : 
            isStale ? 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]' : 
            'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
          }`}></div>
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight group-hover:text-zinc-300 transition-colors">
            {keyInfo.alias}
          </span>
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
  const { simState, setSimState, busState } = useDataStore();
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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-zinc-950">
      {/* VTR Controller Bar */}
      <div className="p-4 pt-12 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md sticky top-0 z-20 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${simState === 'playing' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse' : simState === 'paused' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-zinc-700'}`}></div>
              <h3 className="text-[12px] font-black text-zinc-100 uppercase tracking-widest">Story Control</h3>
            </div>
            <span className="text-[8px] text-zinc-600 font-mono tracking-tighter mt-1 uppercase">
              {simState.toUpperCase()} MODE | CLUSTER ALPHA
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-black border border-zinc-800 rounded-lg p-1 gap-1">
              <button 
                onClick={simState === 'playing' ? handlePause : handleStart}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${simState === 'playing' ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' : 'bg-blue-600 text-white hover:bg-blue-500'}`}
                title={simState === 'playing' ? 'Pause Simulation' : 'Start Simulation'}
              >
                {simState === 'playing' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="m7 4 12 8-12 8V4z"/></svg>
                )}
              </button>
              
              <button 
                onClick={handleStep}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:scale-95 transition-all"
                title="Step Forward (Single Action)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 8 4 4-4 4"/><path d="M2 12h20"/></svg>
              </button>

              <button 
                onClick={handleStop}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-500 hover:text-red-400 hover:bg-red-900/20 transition-all"
                title="Reset/Stop"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect width="14" height="14" x="5" y="5" rx="2"/></svg>
              </button>
            </div>

            <div className="flex bg-black/50 border border-zinc-800 rounded-lg p-1">
              {(['compact', 'standard', 'verbose'] as DensityMode[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDensity(d)}
                  className={`w-7 h-7 flex items-center justify-center text-[10px] font-black uppercase rounded transition-all ${density === d ? 'bg-zinc-800 text-blue-400 shadow-inner' : 'text-zinc-700 hover:text-zinc-500'}`}
                >
                  {d.charAt(0)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Narrative Scenarios */}
        <div className="space-y-2">
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block ml-1">Live Story Scenarios</span>
          <div className="grid grid-cols-2 gap-2">
            {MLB_SCENARIOS.map(s => (
              <button
                key={s.id}
                onClick={() => applyScenario(s.id)}
                className="flex flex-col text-left p-3 bg-black/40 border border-zinc-800 rounded-xl hover:bg-zinc-800 hover:border-blue-500/30 transition-all group relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm group-hover:scale-125 transition-transform duration-300">{s.icon}</span>
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-tight group-hover:text-blue-400">{s.label}</span>
                </div>
                <p className="text-[8px] text-zinc-600 font-medium leading-tight group-hover:text-zinc-400">{s.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800">
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Registry State</span>
              <div className="h-px w-12 bg-zinc-800"></div>
            </div>
            <span className="text-[8px] text-zinc-700 font-mono font-bold uppercase">{density}</span>
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

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
             <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Producer Log</span>
              <div className="h-px w-12 bg-zinc-800"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${busState === 'streaming' ? 'bg-green-500 animate-pulse' : 'bg-zinc-800'}`}></div>
              <span className="text-[9px] text-zinc-600 font-mono font-bold uppercase">Live</span>
            </div>
          </div>

          <div className="space-y-2">
            {events.slice(0, 30).map((ev: any) => (
              <div 
                key={ev.seq} 
                className="bg-black/60 rounded-xl p-3 border border-zinc-800/60 flex justify-between items-center transition-all animate-in slide-in-from-right-4 duration-500"
              >
                <div className="flex flex-col gap-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] px-2 py-0.5 font-black rounded border uppercase tracking-widest ${
                      ev.payload?.event === 'SCENARIO_LOADED' 
                        ? 'bg-blue-600 text-white border-blue-400' 
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      {ev.payload?.event || 'DATA'}
                    </span>
                    <span className="text-[11px] text-zinc-100 font-bold tracking-tight truncate">
                      {ev.payload?.scenario || ev.payload?.score || 'State Update'}
                    </span>
                  </div>
                  {ev.payload?.description && (
                    <p className="text-[9px] text-zinc-600 italic truncate pl-1">{ev.payload.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className="text-[9px] text-zinc-700 font-mono tabular-nums">
                    {new Date(ev.ts).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800/40 rounded-3xl bg-black/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-800 mb-4"><path d="M12 2v20"/><path d="M2 12h20"/></svg>
                <p className="text-[10px] text-zinc-700 font-black uppercase tracking-widest opacity-60">Awaiting Simulation Data</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="p-3 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between sticky bottom-0 z-20">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${busState === 'streaming' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-zinc-800'}`}></div>
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.1em]">
            Distribution: {busState.toUpperCase()}
          </span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => liveBus.runSelfTest()} 
            className="text-[8px] font-black text-zinc-600 hover:text-blue-400 transition-colors uppercase tracking-widest border border-zinc-800 px-2 py-0.5 rounded-lg"
          >
            Diag
          </button>
        </div>
      </div>
    </div>
  );
};

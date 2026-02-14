
import React, { useState, useEffect } from 'react';
import { liveBus, LiveValueRecord } from '../../../shared/data-runtime';
import { mlbSimulator, SimulationPreset } from '../services/MLBSimulator';
import { MLB_CANON_DICTIONARY, MLB_KEYS } from '../../../contract/dictionaries/mlb';
import { Button } from '../../../shared/components/Button';
import { useDataStore } from '../store/useDataStore';

export const LiveMonitor: React.FC = () => {
  const { simState, setSimState, busState, setBusState } = useDataStore();
  const [lastMsg, setLastMsg] = useState<any>(null);
  const [tick, setTick] = useState(0);

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

  const handleStop = () => {
    mlbSimulator.stop();
    setSimState('stopped');
  };

  const handleReset = () => {
    mlbSimulator.reset();
  };

  const applyPreset = (preset: SimulationPreset) => {
    mlbSimulator.applyPreset(preset);
  };

  const eventRecord = liveBus.getValue(MLB_KEYS.GAME_EVENTS);
  const events = Array.isArray(eventRecord?.value) ? [...eventRecord!.value].reverse() : [];

  const presets: { id: SimulationPreset; label: string; icon: string }[] = [
    { id: 'inning_start', label: 'Clean Start', icon: '⚾' },
    { id: 'bases_loaded', label: 'Bases Full', icon: '🔥' },
    { id: 'close_game', label: 'High Stakes', icon: '⏳' },
    { id: 'blowout', label: 'Run Fest', icon: '🚀' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none">
      {/* Simulation Studio Header */}
      <div className="p-4 pt-12 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md sticky top-0 z-20 space-y-4 shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${simState === 'playing' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-zinc-700'}`}></div>
              <h3 className="text-[11px] font-black text-zinc-100 uppercase tracking-widest">Simulation Feed</h3>
            </div>
            <span className="text-[9px] text-zinc-600 font-mono tracking-tighter mt-1 block">
              {lastMsg?.sourceId ? `BUS ALPHA | SRC: ${lastMsg.sourceId}` : 'BUS STANDBY'}
            </span>
          </div>
          <div className="flex gap-1.5">
            {simState !== 'playing' ? (
              <Button size="sm" onClick={handleStart} variant="primary" className="h-8 text-[9px] px-4 font-black flex items-center gap-2 group shadow-lg shadow-blue-900/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="group-hover:scale-110 transition-transform"><path d="m7 4 12 8-12 8V4z"/></svg>
                PLAY SIM
              </Button>
            ) : (
              <Button size="sm" onClick={handleStop} variant="danger" className="h-8 text-[9px] px-4 font-black flex items-center gap-2 group shadow-lg shadow-red-900/20">
                 <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect width="14" height="14" x="5" y="5" rx="2"/></svg>
                STOP
              </Button>
            )}
            <Button size="sm" variant="secondary" onClick={handleReset} className="h-8 w-8 p-0" title="Reset Simulation">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {presets.map(p => (
            <button
              key={p.id}
              onClick={() => applyPreset(p.id)}
              className="flex items-center gap-2 p-2 bg-black/40 border border-zinc-800 rounded-lg hover:bg-zinc-800 hover:border-blue-500/30 transition-all text-left group"
            >
              <span className="text-xs group-hover:scale-125 transition-transform duration-300">{p.icon}</span>
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-zinc-100">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800">
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Live Registry</span>
              <div className="h-0.5 w-12 bg-zinc-800"></div>
            </div>
            <span className="text-[9px] text-zinc-600 font-mono font-bold uppercase">Distributing Signals</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {MLB_CANON_DICTIONARY.keys.filter(k => k.kind === 'state').map(key => {
              const record = liveBus.getValue(key.keyId);
              return (
                <div 
                  key={key.keyId} 
                  className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-zinc-800/40 hover:bg-zinc-800/20 transition-all group"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight group-hover:text-zinc-400 transition-colors">
                      {key.alias}
                    </span>
                    <span className="text-[8px] text-zinc-700 font-mono uppercase tracking-tighter">
                      {key.canonicalPath}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-[12px] font-mono font-black ${record ? 'text-blue-400' : 'text-zinc-800'}`}>
                      {record ? (typeof record.value === 'boolean' ? (record.value ? 'TRUE' : 'FALSE') : String(record.value)) : '---'}
                    </span>
                    {record && (
                      <div className="flex items-center justify-end gap-1 mt-0.5 animate-in fade-in slide-in-from-top-1">
                        <div className="w-1 h-1 rounded-full bg-blue-500/40"></div>
                        <span className="text-[7px] text-zinc-700 font-bold uppercase tracking-widest">OUTBOUND</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
             <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Event Log</span>
              <div className="h-0.5 w-12 bg-zinc-800"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${busState === 'streaming' ? 'bg-green-500 animate-pulse' : 'bg-zinc-800'}`}></div>
              <span className="text-[9px] text-zinc-600 font-mono font-bold uppercase">Monitoring</span>
            </div>
          </div>

          <div className="space-y-2">
            {events.slice(0, 15).map((ev: any, i) => (
              <div 
                key={ev.seq} 
                className="bg-black/50 rounded-xl p-3 border border-zinc-800/40 flex justify-between items-center transition-all animate-in slide-in-from-right-4 duration-500"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] px-2 py-0.5 font-black rounded-lg border uppercase tracking-widest ${
                      ev.payload?.event === 'PRESET_APPLIED' 
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}>
                      {ev.payload?.event || 'SIGNAL'}
                    </span>
                    <span className="text-[11px] text-zinc-100 font-bold tracking-tight">
                      {ev.payload?.scenario || ev.payload?.reason || ev.payload?.score || 'Status Update'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[8px] text-zinc-700 font-bold uppercase">
                    <span>SEQ: {ev.seq}</span>
                    <span className="w-0.5 h-0.5 bg-zinc-800 rounded-full"></span>
                    <span>TS: {ev.ts % 1000}</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className="text-[9px] text-zinc-500 font-mono font-bold tabular-nums">
                    {new Date(ev.ts).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <div className="w-4 h-0.5 bg-blue-500/20 rounded-full"></div>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800/50 rounded-2xl bg-black/20">
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest leading-relaxed text-center px-4 opacity-40">
                  Awaiting traffic on Alpha Bus
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="p-3 bg-zinc-950/90 border-t border-zinc-800 flex items-center justify-between sticky bottom-0 z-20">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${busState === 'streaming' ? 'bg-green-500' : 'bg-zinc-800'}`}></div>
          <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.15em]">
            BUS: {busState.toUpperCase()}
          </span>
        </div>
        <button 
          onClick={() => liveBus.runSelfTest()} 
          className="text-[9px] font-black text-zinc-500 hover:text-blue-400 transition-colors uppercase tracking-widest border border-zinc-800 px-2 py-0.5 rounded"
        >
          Diagnostics
        </button>
      </div>
    </div>
  );
};

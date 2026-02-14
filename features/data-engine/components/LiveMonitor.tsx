
import React, { useState, useEffect } from 'react';
import { liveBus, LiveValueRecord } from '../../../shared/data-runtime';
import { mlbSimulator } from '../services/MLBSimulator';
import { MLB_CANON_DICTIONARY, MLB_KEYS } from '../../../contract/dictionaries/mlb';
import { Button } from '../../../shared/components/Button';

export const LiveMonitor: React.FC = () => {
  const [isSimulating, setIsSimulating] = useState(false);
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
    setIsSimulating(true);
  };

  const handleStop = () => {
    mlbSimulator.stop();
    setIsSimulating(false);
  };

  const handleReset = () => {
    mlbSimulator.reset();
  };

  const eventRecord = liveBus.getValue(MLB_KEYS.GAME_EVENTS);
  const events = Array.isArray(eventRecord?.value) ? [...eventRecord!.value].reverse() : [];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/80 backdrop-blur-md sticky top-0 z-20">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
            <h3 className="text-[11px] font-black text-zinc-100 uppercase tracking-widest">Live Bus Monitor</h3>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] text-zinc-600 font-mono tracking-tighter">
              {lastMsg?.sourceId ? `SRC: ${lastMsg.sourceId}` : 'BUS STANDBY'}
            </span>
            {isSimulating && (
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 font-bold animate-pulse">
                SIMULATING
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1.5">
          {!isSimulating ? (
            <Button size="sm" onClick={handleStart} variant="primary" className="h-7 text-[9px] px-3 font-black">START</Button>
          ) : (
            <Button size="sm" onClick={handleStop} variant="danger" className="h-7 text-[9px] px-3 font-black">STOP</Button>
          )}
          <Button size="sm" variant="secondary" onClick={handleReset} className="h-7 w-7 p-0" title="Reset Simulation">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800">
        {/* Active State Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Active State</span>
              <div className="h-0.5 w-12 bg-zinc-800"></div>
            </div>
            <span className="text-[9px] text-zinc-600 font-mono font-bold">MSG {lastMsg?.seq || 0}</span>
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
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <div className="w-1 h-1 rounded-full bg-blue-500/40"></div>
                        <span className="text-[7px] text-zinc-700 font-bold uppercase">LIVE</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Event Stream Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
             <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Recent Events</span>
              <div className="h-0.5 w-12 bg-zinc-800"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 animate-pulse"></div>
              <span className="text-[9px] text-zinc-600 font-mono font-bold">STREAMING</span>
            </div>
          </div>

          <div className="space-y-2">
            {events.slice(0, 10).map((ev: any, i) => (
              <div 
                key={i} 
                className="bg-black/50 rounded-xl p-3 border border-zinc-800/40 flex justify-between items-center transition-all animate-in slide-in-from-right-2"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] px-2 py-0.5 bg-zinc-800 text-blue-400 font-black rounded-lg border border-zinc-700 uppercase tracking-widest">
                      {ev.payload?.event || 'SIGNAL'}
                    </span>
                    <span className="text-[11px] text-zinc-100 font-bold tracking-tight">
                      {ev.payload?.reason || ev.payload?.score || 'Status Update'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[8px] text-zinc-700 font-bold uppercase">
                    <span>SEQ: {ev.seq}</span>
                    <span className="w-0.5 h-0.5 bg-zinc-800 rounded-full"></span>
                    <span>BUS ALPHA</span>
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
                <div className="w-10 h-10 bg-zinc-800/30 rounded-full flex items-center justify-center mb-3">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-700"><path d="M12 2v4"/><path d="m16.2 4.2 2.8 2.8"/><path d="M18 12h4"/><path d="m16.2 19.8 2.8-2.8"/><path d="M12 18v4"/><path d="m4.2 19.8 2.8-2.8"/><path d="M2 12h4"/><path d="m4.2 4.2 2.8 2.8"/></svg>
                </div>
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Waiting for events...</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-zinc-950/90 border-t border-zinc-800 flex items-center justify-between sticky bottom-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse' : 'bg-zinc-800'}`}></div>
          <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.15em]">
            SYSTEM STATUS: {isSimulating ? 'ACTIVE' : 'IDLE'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[8px] font-mono text-zinc-700">TICK:{tick}</span>
          <button 
            onClick={() => liveBus.runSelfTest()} 
            className="text-[9px] font-black text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-widest"
          >
            Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};

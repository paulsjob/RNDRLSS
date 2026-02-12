
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
    <div className="flex-1 flex flex-col bg-zinc-900 border-l border-zinc-800 h-full overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50 shadow-sm z-10">
        <div>
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Live Bus Monitor</h3>
          <p className="text-[9px] text-zinc-600 font-mono mt-0.5 truncate max-w-[120px]">
            {lastMsg?.sourceId ? `ID: ${lastMsg.sourceId}` : 'Status: Idle'}
          </p>
        </div>
        <div className="flex gap-2">
          {!isSimulating ? (
            <Button size="sm" onClick={handleStart} variant="primary">Start Sim</Button>
          ) : (
            <Button size="sm" onClick={handleStop} variant="danger">Stop Sim</Button>
          )}
          <Button size="sm" variant="secondary" onClick={handleReset}>Reset</Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
        {/* State Table */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active State</h4>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-zinc-600 font-mono">SEQ: {lastMsg?.seq || 0}</span>
              <div className="h-1 w-8 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300" 
                  style={{ width: `${(tick % 10) * 10}%` }}
                />
              </div>
            </div>
          </div>
          <div className="bg-black/40 rounded-lg border border-zinc-800/50 overflow-hidden">
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr className="bg-zinc-800/30 text-zinc-600 text-left border-b border-zinc-800">
                  <th className="px-3 py-2 font-bold uppercase tracking-tighter">Key Alias</th>
                  <th className="px-3 py-2 font-bold uppercase tracking-tighter">Live Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {MLB_CANON_DICTIONARY.keys.filter(k => k.kind === 'state').map(key => {
                  const record = liveBus.getValue(key.keyId);
                  return (
                    <tr key={key.keyId} className="group hover:bg-zinc-800/20 transition-colors">
                      <td className="px-3 py-2 text-zinc-500 group-hover:text-zinc-300">{key.alias}</td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded font-bold ${record ? 'text-blue-400 bg-blue-400/5' : 'text-zinc-700'}`}>
                          {record ? (typeof record.value === 'boolean' ? (record.value ? 'YES' : 'NO') : JSON.stringify(record.value)) : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Event Stream */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recent Events</h4>
            <span className="text-[9px] text-zinc-600 font-mono">Capped: 200</span>
          </div>
          <div className="space-y-1.5">
            {events.slice(0, 8).map((ev: any, i) => (
              <div key={i} className="bg-zinc-800/20 rounded-md p-2.5 border border-zinc-800/30 flex justify-between items-center transition-all animate-in slide-in-from-right-1">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] px-1 bg-blue-500/10 text-blue-500 font-black rounded border border-blue-500/20 uppercase tracking-tighter">
                      {ev.payload?.event || 'LOG'}
                    </span>
                    <span className="text-[10px] text-zinc-200 font-medium">
                      {ev.payload?.reason || ev.payload?.score || 'Update received'}
                    </span>
                  </div>
                  <span className="text-[8px] text-zinc-600 font-mono">SEQ: {ev.seq}</span>
                </div>
                <span className="text-[8px] text-zinc-700 font-mono tabular-nums">
                  {new Date(ev.ts).toLocaleTimeString([], { hour12: false })}
                </span>
              </div>
            ))}
            {events.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-zinc-800 rounded-lg">
                <p className="text-[10px] text-zinc-600 italic">No events currently in the bus.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="p-3 bg-zinc-950/80 backdrop-blur-md border-t border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${isSimulating ? 'bg-green-500 shadow-green-500/20 animate-pulse' : 'bg-zinc-700'}`}></div>
          <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Simulator {isSimulating ? 'Active' : 'Standby'}</span>
        </div>
        <button 
          onClick={() => liveBus.runSelfTest()} 
          className="px-2 py-1 text-[8px] text-zinc-600 hover:text-blue-500 hover:bg-blue-500/5 rounded transition-all uppercase font-bold tracking-widest"
        >
          Run Diagnostic
        </button>
      </div>
    </div>
  );
};

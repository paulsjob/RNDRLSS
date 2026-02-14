
import React, { useEffect, useRef } from 'react';
import { useDataStore, SourceMode } from '../store/useDataStore';
import { Button } from '../../../shared/components/Button';

export const GoldenPathPanel: React.FC = () => {
  const { goldenPath, setGoldenPathSource, updateRawInput, toggleGoldenSim, setGoldenSimSpeed, validateGoldenPath } = useDataStore();
  
  // Simulated feed logic
  useEffect(() => {
    let interval: any;
    if (goldenPath.simRunning && goldenPath.sourceMode === 'simulated') {
      const speeds = { slow: 3000, normal: 1000, fast: 300 };
      interval = setInterval(() => {
        const newVal = Math.floor(Math.random() * 100);
        updateRawInput(String(newVal));
      }, speeds[goldenPath.simSpeed]);
    }
    return () => clearInterval(interval);
  }, [goldenPath.simRunning, goldenPath.sourceMode, goldenPath.simSpeed]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 overflow-hidden">
      <div className="p-6 pt-12 space-y-8 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
        
        {/* Step 1: Select Source */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">1. Data Source</h3>
            <span className="text-[8px] text-zinc-700 font-mono italic">INGESTION TIER</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'manual' as SourceMode, label: 'Manual Entry', desc: 'Direct slider/input control', icon: '⌨️' },
              { id: 'simulated' as SourceMode, label: 'Simulated Feed', desc: 'Real-time random updates', icon: '🤖' },
              { id: 'static' as SourceMode, label: 'Static JSON', desc: 'Structured schema input', icon: '📄' }
            ].map(source => (
              <button
                key={source.id}
                onClick={() => setGoldenPathSource(source.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${goldenPath.sourceMode === source.id ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'bg-black/40 border-zinc-800 hover:border-zinc-700'}`}
              >
                <span className="text-xl">{source.icon}</span>
                <div className="flex flex-col overflow-hidden">
                   <span className={`text-[11px] font-black uppercase tracking-widest ${goldenPath.sourceMode === source.id ? 'text-blue-400' : 'text-zinc-300'}`}>{source.label}</span>
                   <p className="text-[9px] text-zinc-600 truncate">{source.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Interaction Area */}
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
           <div className="p-5 bg-black/60 rounded-3xl border border-zinc-800 shadow-inner space-y-6">
              {goldenPath.sourceMode === 'manual' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Adjust Value</label>
                    <span className="text-xl font-mono font-black text-blue-400">{goldenPath.rawInput}</span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    value={isNaN(Number(goldenPath.rawInput)) ? 0 : Number(goldenPath.rawInput)}
                    onChange={(e) => updateRawInput(e.target.value)}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              )}

              {goldenPath.sourceMode === 'simulated' && (
                <div className="space-y-6">
                   <div className="flex items-center justify-between">
                     <span className="text-[9px] text-zinc-600 font-black uppercase">Lifecycle</span>
                     <Button 
                        size="sm" 
                        variant={goldenPath.simRunning ? 'danger' : 'primary'} 
                        onClick={toggleGoldenSim}
                        className="h-8 px-6 rounded-full font-black uppercase tracking-widest text-[9px]"
                      >
                        {goldenPath.simRunning ? 'Pause Sim' : 'Start Sim'}
                      </Button>
                   </div>
                   <div className="space-y-2">
                      <span className="text-[9px] text-zinc-600 font-black uppercase block">Tick Rate</span>
                      <div className="flex gap-1 bg-zinc-900 p-1 rounded-xl">
                        {(['slow', 'normal', 'fast'] as const).map(s => (
                          <button
                            key={s}
                            onClick={() => setGoldenSimSpeed(s)}
                            className={`flex-1 py-1 text-[8px] font-black uppercase rounded-lg transition-all ${goldenPath.simSpeed === s ? 'bg-zinc-800 text-blue-400 shadow-inner' : 'text-zinc-700 hover:text-zinc-500'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                   </div>
                </div>
              )}

              {goldenPath.sourceMode === 'static' && (
                <div className="space-y-2">
                   <label className="text-[9px] text-zinc-600 font-black uppercase">Payload Buffer</label>
                   <textarea 
                     value={goldenPath.rawInput}
                     onChange={(e) => updateRawInput(e.target.value)}
                     className="w-full h-32 bg-black border border-zinc-800 rounded-xl p-4 font-mono text-[10px] text-blue-100 focus:border-blue-500 outline-none resize-none shadow-inner"
                     placeholder='{"score": 10}'
                   />
                </div>
              )}
           </div>
        </section>

        {/* Payload Preview */}
        <section className="space-y-2">
           <div className="flex items-center justify-between px-1">
             <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Raw Payload Preview</span>
             <span className="text-[8px] text-zinc-800 font-mono">EMITTING...</span>
           </div>
           <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800/50 min-h-[60px] flex items-center justify-center font-mono text-xs text-blue-500/60 shadow-inner">
              {goldenPath.rawInput || 'EMPTY_BUFFER'}
           </div>
        </section>
      </div>

      <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 space-y-4">
        <Button 
          variant="primary" 
          size="lg" 
          onClick={validateGoldenPath}
          className="w-full h-12 font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-blue-600/10 active:scale-95 transition-all"
        >
          Analyze Pipeline
        </Button>
        {goldenPath.error && (
          <p className="text-[10px] text-red-500 font-bold text-center animate-in fade-in slide-in-from-top-1">
            ⚠️ {goldenPath.error}
          </p>
        )}
      </div>
    </div>
  );
};

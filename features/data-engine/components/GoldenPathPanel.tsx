import React, { useEffect, useRef, useState } from 'react';
import { useDataStore, SourceMode } from '../store/useDataStore';
import { useStudioStore } from '../../studio/store/useStudioStore';
import { Button } from '../../../shared/components/Button';
import { MLB_KEYS } from '../../../contract/dictionaries/mlb';

export const GoldenPathPanel: React.FC = () => {
  const { 
    goldenPath, 
    setGoldenPathSource, 
    updateRawInput, 
    validateGoldenPath,
    simController,
    startDemoPipeline,
    bindToGraphic
  } = useDataStore();

  const [isDemoBinding, setIsDemoBinding] = useState(false);
  
  const handleLaunchDemo = () => {
    setIsDemoBinding(true);
    
    // 1. Activate Unified Simulation (ITEM 33)
    startDemoPipeline();
    setGoldenPathSource('demo');
    
    // 2. Programmatically Bind Layers in Studio
    const studio = useStudioStore.getState();
    studio.setBinding('layer-home-score', 'text', MLB_KEYS.SCORE_HOME);
    studio.setBinding('layer-away-score', 'text', MLB_KEYS.SCORE_AWAY);
    studio.setBinding('layer-game-clock', 'text', MLB_KEYS.GAME_CLOCK);
    
    // 3. Update Demo State
    bindToGraphic("MLB Live Bug");
    validateGoldenPath();
    
    setTimeout(() => setIsDemoBinding(false), 1500);
  };

  const isSimActive = simController.status === 'running' || simController.status === 'paused';
  const isDemoActive = isSimActive && simController.mode === 'demoPipeline';

  return (
    <div className="flex flex-col h-full bg-zinc-950 overflow-hidden">
      <div className="p-6 pt-12 space-y-8 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
        
        {/* DEMO CTA */}
        <section className="bg-blue-600/5 p-6 rounded-[2.5rem] border border-blue-500/20 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-pulse"></div>
           <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Quick Start</h3>
                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${isDemoActive ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                  {isDemoActive ? 'SIM ACTIVE' : 'READY'}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-black text-white leading-tight">Run Demo Pipeline</h4>
                <p className="text-[9px] text-zinc-500 uppercase font-bold leading-relaxed">Instantly connect mock telemetry to the broadcast canvas with zero configuration.</p>
              </div>
              <Button 
                variant="primary" 
                size="lg" 
                onClick={handleLaunchDemo}
                disabled={isDemoBinding}
                className={`w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl transition-all ${isDemoActive ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' : 'bg-blue-600 shadow-blue-600/20 hover:scale-[1.02]'}`}
              >
                {isDemoBinding ? 'Wiring Graphics...' : isDemoActive ? 'Pipeline Running' : '🚀 Run Demo'}
              </Button>
           </div>
        </section>

        {/* Step 1: Data Source Selector */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Manual Controls</h3>
            <span className="text-[8px] text-zinc-700 font-mono italic">INGESTION OVERRIDE</span>
          </div>

          <div className="grid grid-cols-1 gap-2 opacity-50 hover:opacity-100 transition-opacity">
            {[
              { id: 'manual' as SourceMode, label: 'Manual Entry', desc: 'Direct slider/input control', icon: '⌨️' },
              { id: 'simulated' as SourceMode, label: 'Static Payload', desc: 'Structured JSON buffer', icon: '📄' },
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
        {goldenPath.sourceMode !== 'demo' && (
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
             </div>
          </section>
        )}
      </div>

      <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 space-y-4">
        <Button 
          variant="secondary" 
          size="lg" 
          onClick={validateGoldenPath}
          className="w-full h-12 font-black uppercase tracking-[0.2em] text-[11px] border-2 border-zinc-800"
        >
          Analyze Graph Health
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

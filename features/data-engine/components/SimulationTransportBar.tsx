
import React from 'react';
import { useDataStore } from '../store/useDataStore';

export const SimulationTransportBar: React.FC = () => {
  const { simController, transportStart, transportStop, transportPause, isTruthMode } = useDataStore();

  const isRunning = simController.status === 'running';
  const isPaused = simController.status === 'paused';
  const isIdle = simController.status === 'idle';

  return (
    <div className={`flex items-center gap-3 bg-black/60 border border-zinc-800 px-3 py-1.5 rounded-2xl transition-all duration-500 ${isTruthMode ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
      
      {/* Mode Status Indicator */}
      <div className="flex flex-col min-w-[100px] border-r border-zinc-800 pr-3">
        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1">Engine Status</span>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]' : isPaused ? 'bg-amber-500' : 'bg-zinc-800'}`}></div>
          <span className={`text-[10px] font-black uppercase tracking-tight ${isRunning ? 'text-zinc-100' : isPaused ? 'text-amber-500' : 'text-zinc-500'}`}>
            {isIdle ? 'Ready' : isRunning ? (simController.mode?.toUpperCase() || 'RUNNING') : 'Paused'}
          </span>
        </div>
      </div>

      {/* VTR Controls */}
      <div className="flex items-center gap-1">
        <button 
          onClick={transportStart}
          title={isRunning ? "Pause" : "Start Simulation"}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isRunning ? 'bg-zinc-800 text-amber-500 hover:bg-zinc-700' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'}`}
        >
          {isRunning ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect width="4" height="16" x="6" y="4"/><rect width="4" height="16" x="14" y="4"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="m7 4 12 8-12 8V4z"/></svg>
          )}
        </button>

        <button 
          onClick={transportStop}
          disabled={isIdle}
          title="Stop All"
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${isIdle ? 'text-zinc-800' : 'bg-zinc-800 text-red-500 hover:bg-red-500/20'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect width="12" height="12" x="6" y="6" rx="2"/></svg>
        </button>
      </div>

      {/* Status Metadata */}
      {!isIdle && (
        <div className="hidden lg:flex flex-col pl-3 border-l border-zinc-800 animate-in fade-in slide-in-from-left-2">
           <span className="text-[7px] font-mono text-zinc-600 uppercase tracking-tighter">Workflow Mode</span>
           <span className="text-[9px] font-mono font-bold text-blue-400/80 truncate max-w-[80px]">
             {simController.activeScenarioId || simController.mode || '---'}
           </span>
        </div>
      )}
    </div>
  );
};

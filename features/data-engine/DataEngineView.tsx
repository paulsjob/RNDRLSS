
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DataDictionaryBrowser } from './DataDictionaryBrowser';
import { NodeCanvas } from './NodeCanvas';
import { LiveMonitor } from './components/LiveMonitor';
import { BindingTestConsole } from './components/BindingTestConsole';
import { SnapshotManager } from './components/SnapshotManager';
import { useDataStore } from './store/useDataStore';

const PipelineHeader: React.FC = () => {
  const { activeAdapterId, availableAdapters, simState, busState } = useDataStore();
  const adapter = availableAdapters.find(a => a.id === activeAdapterId);

  return (
    <div className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6 shrink-0 z-50">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-black text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded uppercase tracking-widest">Pipeline</div>
          <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-widest">Data Engine Studio</h2>
        </div>
        
        <div className="h-4 w-px bg-zinc-800"></div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[8px] text-zinc-600 font-black uppercase tracking-tighter">Active Provider</span>
            <span className="text-[10px] text-zinc-300 font-bold uppercase">{adapter?.name || 'Loading...'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        {/* Simulation State */}
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${simState === 'playing' ? 'bg-blue-500 animate-pulse' : 'bg-zinc-700'}`}></div>
          <div className="flex flex-col">
             <span className="text-[8px] text-zinc-600 font-black uppercase tracking-tighter leading-none">Simulation</span>
             <span className={`text-[10px] font-black uppercase leading-none mt-1 ${simState === 'playing' ? 'text-blue-400' : 'text-zinc-500'}`}>
               {simState === 'playing' ? 'Active' : 'Stopped'}
             </span>
          </div>
        </div>

        {/* Bus Health */}
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${busState === 'streaming' ? 'bg-green-500' : 'bg-zinc-700'}`}></div>
          <div className="flex flex-col">
             <span className="text-[8px] text-zinc-600 font-black uppercase tracking-tighter leading-none">Bus Status</span>
             <span className={`text-[10px] font-black uppercase leading-none mt-1 ${busState === 'streaming' ? 'text-green-400' : 'text-zinc-500'}`}>
               {busState === 'streaming' ? 'Streaming' : 'Idle'}
             </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 bg-black/50 border border-zinc-800 rounded-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500/50"></div>
          <span className="text-[9px] font-mono text-zinc-500">BUS ALPHA OK</span>
        </div>
      </div>
    </div>
  );
};

export const DataEngineView: React.FC = () => {
  const [monitorWidth, setMonitorWidth] = useState(() => {
    const saved = localStorage.getItem('renderless:ui:monitor-width');
    return saved ? parseInt(saved, 10) : 420;
  });
  const isResizing = useRef(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
    localStorage.setItem('renderless:ui:monitor-width', monitorWidth.toString());
  }, [monitorWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    const minWidth = 300;
    const maxWidth = Math.min(800, window.innerWidth * 0.45);
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setMonitorWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', stopResizing);
    };
  }, [handleMouseMove, stopResizing]);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-zinc-950">
      <PipelineHeader />
      
      <div className="flex-1 flex min-w-0 overflow-hidden relative">
        {/* Step 1: Sources */}
        <div className="flex flex-col shrink-0 relative group">
          <div className="absolute top-0 right-0 h-full w-4 flex items-center justify-center pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500/20"><path d="m9 18 6-6-6-6"/></svg>
          </div>
          <DataDictionaryBrowser />
        </div>
        
        {/* Step 2: Logic Canvas */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <div className="absolute top-3 left-4 z-10 pointer-events-none">
            <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md backdrop-blur-md">
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em]">2. Logic Transform</span>
            </div>
          </div>
          
          <div className="flex-1 relative">
            <NodeCanvas />
          </div>
          
          <div className="shrink-0 flex flex-col">
            <div className="h-6 flex items-center justify-center bg-black/40 border-t border-zinc-800/50">
               <span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.5em] flex items-center gap-2">
                 Manual Overrides & Snapshots
                 <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m7 13 5 5 5-5M7 6l5 5 5-5"/></svg>
               </span>
            </div>
            <BindingTestConsole />
            <SnapshotManager />
          </div>
        </div>

        {/* Resize Handle */}
        <div 
          onMouseDown={startResizing}
          className="w-1.5 bg-zinc-800 hover:bg-blue-600 transition-colors cursor-col-resize z-[60] flex-shrink-0 relative group"
          title="Drag to resize monitor"
        >
          <div className="absolute top-1/2 -left-1 w-4 h-12 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity">
             <div className="w-[1px] h-4 bg-zinc-500 mx-[1px]"></div>
             <div className="w-[1px] h-4 bg-zinc-500 mx-[1px]"></div>
          </div>
        </div>

        {/* Step 3: Bus Monitor */}
        <div style={{ width: monitorWidth }} className="flex-shrink-0 flex flex-col h-full overflow-hidden bg-zinc-900 border-l border-zinc-800 relative">
          <div className="absolute top-3 left-4 z-10 pointer-events-none">
            <div className="flex items-center gap-2 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-md backdrop-blur-md">
              <span className="text-[9px] font-black text-green-400 uppercase tracking-[0.2em]">3. Distribution Bus</span>
            </div>
          </div>
          <LiveMonitor />
        </div>
      </div>
    </div>
  );
};

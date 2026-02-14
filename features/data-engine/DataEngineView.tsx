
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DataDictionaryBrowser } from './DataDictionaryBrowser';
import { NodeCanvas } from './NodeCanvas';
import { LiveMonitor } from './components/LiveMonitor';
import { BindingTestConsole } from './components/BindingTestConsole';
import { SnapshotManager } from './components/SnapshotManager';
import { useDataStore } from './store/useDataStore';
import { GoldenPathPanel } from './components/GoldenPathPanel';
import { PipelineVisualizer } from './components/PipelineVisualizer';
import { Button } from '../../shared/components/Button';

const PipelineHeader: React.FC = () => {
  const { 
    activeAdapterId, 
    availableAdapters, 
    simState, 
    busState, 
    isTruthMode, 
    setTruthMode, 
    goldenPath,
    createDemoPipeline,
    nodes
  } = useDataStore();
  const adapter = availableAdapters.find(a => a.id === activeAdapterId);

  return (
    <div className={`h-12 border-b flex items-center justify-between px-6 shrink-0 z-[70] transition-colors duration-500 ${isTruthMode ? 'bg-zinc-950 border-blue-900/50' : 'bg-zinc-900 border-zinc-800'}`}>
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest transition-all ${isTruthMode ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
            {isTruthMode ? 'Reality-Active' : 'Golden Path Demo'}
          </div>
          <h2 className={`text-xs font-bold uppercase tracking-widest transition-colors ${isTruthMode ? 'text-blue-400' : 'text-zinc-100'}`}>
            Pipeline Intelligence
          </h2>
        </div>
        
        <div className="h-4 w-px bg-zinc-800"></div>

        {!isTruthMode && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={createDemoPipeline}
            className="h-7 text-[10px] font-black uppercase tracking-widest border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-blue-900/10"
          >
            Create Demo Pipeline
          </Button>
        )}
        
        <div className="flex items-center gap-4">
           <div className={`w-2 h-2 rounded-full ${simState === 'playing' ? 'bg-blue-500 animate-pulse' : 'bg-zinc-700'}`}></div>
           <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
             {simState === 'playing' ? 'Live Feed Active' : 'Simulation Standby'}
           </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 px-3 py-1 bg-black/40 border border-zinc-800 rounded-lg">
           <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Flow:</span>
           <span className="text-[10px] font-mono font-bold text-blue-400">{nodes.length} Nodes</span>
        </div>

        {/* Truth Mode Toggle */}
        <div className="flex items-center gap-3 px-4 py-1.5 bg-black border border-zinc-800 rounded-full group cursor-pointer hover:border-blue-500/50 transition-all" onClick={() => setTruthMode(!isTruthMode)}>
           <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${isTruthMode ? 'text-blue-400' : 'text-zinc-600'}`}>Truth Mode</span>
           <div className={`w-8 h-4 rounded-full relative transition-all ${isTruthMode ? 'bg-blue-600' : 'bg-zinc-800'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isTruthMode ? 'left-4.5' : 'left-0.5 shadow-sm'}`}></div>
           </div>
        </div>

        <div className="h-6 w-px bg-zinc-800"></div>

        {/* Bus Health */}
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${busState === 'streaming' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-zinc-700'}`}></div>
          <div className="flex flex-col">
             <span className="text-[8px] text-zinc-600 font-black uppercase tracking-tighter leading-none">Bus Status</span>
             <span className={`text-[10px] font-black uppercase leading-none mt-1 ${busState === 'streaming' ? 'text-green-400' : 'text-zinc-500'}`}>
               {busState === 'streaming' ? 'Streaming' : 'Idle'}
             </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DataEngineView: React.FC = () => {
  const { isTruthMode } = useDataStore();
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

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden transition-all duration-700 ${isTruthMode ? 'bg-zinc-950 ring-inset ring-1 ring-blue-500/20' : 'bg-zinc-950'}`}>
      <PipelineHeader />
      
      <div className="flex-1 flex min-w-0 overflow-hidden relative">
        {/* Truth Scanline Overlay */}
        {isTruthMode && (
          <div className="absolute inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
        )}

        {/* Golden Path Step 1: Source Selection */}
        <div className={`w-[360px] flex flex-col shrink-0 relative group transition-all duration-500 ${isTruthMode ? 'border-blue-900/20 shadow-2xl' : 'border-r border-zinc-800'}`}>
          <GoldenPathPanel />
        </div>
        
        {/* Golden Path Step 2: Visual Pipeline */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <div className="absolute top-3 left-4 z-10 pointer-events-none">
            <div className={`flex items-center gap-2 px-2 py-1 border rounded-md backdrop-blur-md transition-all ${isTruthMode ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">2. Logical Data Path</span>
            </div>
          </div>
          
          <div className="flex-1 relative bg-black/20">
            <NodeCanvas />
          </div>
          
          <div className={`shrink-0 flex flex-col transition-all duration-500 ${isTruthMode ? 'opacity-30 grayscale pointer-events-none blur-[1px]' : ''}`}>
            <SnapshotManager />
          </div>
        </div>

        {/* Resize Handle */}
        <div 
          onMouseDown={startResizing}
          className={`w-1.5 transition-colors cursor-col-resize z-[60] flex-shrink-0 relative group ${isTruthMode ? 'bg-blue-900/30' : 'bg-zinc-800 hover:bg-blue-600'}`}
        >
          <div className="absolute top-1/2 -left-1 w-4 h-12 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity">
             <div className="w-[1px] h-4 bg-zinc-500 mx-[1px]"></div>
             <div className="w-[1px] h-4 bg-zinc-500 mx-[1px]"></div>
          </div>
        </div>

        {/* Golden Path Step 3: Result / Bus Monitoring */}
        <div style={{ width: monitorWidth }} className={`flex-shrink-0 flex flex-col h-full overflow-hidden border-l relative transition-colors duration-500 ${isTruthMode ? 'bg-black border-blue-900/40 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]' : 'bg-zinc-900 border-zinc-800'}`}>
          <div className="absolute top-3 left-4 z-10 pointer-events-none">
            <div className={`flex items-center gap-2 px-2 py-1 border rounded-md backdrop-blur-md transition-all ${isTruthMode ? 'bg-green-600/10 border-green-500 text-green-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">3. Live Distribution Bus</span>
            </div>
          </div>
          <LiveMonitor />
        </div>
      </div>
    </div>
  );
};


import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { DataDictionaryBrowser } from './DataDictionaryBrowser';
import { NodeCanvas } from './NodeCanvas';
import { LiveMonitor } from './components/LiveMonitor';
import { BindingTestConsole } from './components/BindingTestConsole';
import { SnapshotManager } from './components/SnapshotManager';
import { useDataStore } from './store/useDataStore';
import { GoldenPathPanel } from './components/GoldenPathPanel';
import { PipelineVisualizer } from './components/PipelineVisualizer';
import { Button } from '../../shared/components/Button';

/**
 * ITEM 34: Golden Demo Coach Overlay
 */
const GoldenDemoCoach: React.FC = () => {
  const { simController, selection, validation, isTruthMode, resetDemo, demoCoach, setCoachDismissed } = useDataStore();
  
  const currentStep = useMemo(() => {
    if (simController.status === 'idle') return 1;
    if (selection.id === null) return 2;
    if (validation.status !== 'pass') return 3;
    if (!isTruthMode) return 4;
    return 5;
  }, [simController.status, selection.id, validation.status, isTruthMode]);

  const steps = [
    { id: 1, label: 'Initiate Pipeline', desc: 'Click "Run Demo" to start simulation.', completed: currentStep > 1 },
    { id: 2, label: 'Audit Source', desc: 'Select a key from the Dictionary list.', completed: currentStep > 2 },
    { id: 3, label: 'Verify Logic', desc: 'Run "Validate" to check path integrity.', completed: currentStep > 3 },
    { id: 4, label: 'Proof Reality', desc: 'Toggle "Truth Mode" for diagnostics.', completed: currentStep > 4 },
  ];

  if (demoCoach.isDismissed) return null;

  return (
    <div className="fixed bottom-10 left-10 z-[200] w-72 bg-black/80 backdrop-blur-xl border border-blue-500/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
      <div className="p-5 border-b border-white/5 flex items-center justify-between bg-blue-600/10">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
          <span className="text-[10px] font-black text-blue-100 uppercase tracking-widest">Workflow Master</span>
        </div>
        <button onClick={() => setCoachDismissed(true)} className="text-zinc-600 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-1">
          <h4 className="text-[11px] font-black text-white uppercase tracking-widest">Golden Demo Loop</h4>
          <p className="text-[9px] text-zinc-500 uppercase font-bold leading-relaxed">Follow the steps to master the pipeline.</p>
        </div>

        <div className="space-y-4">
          {steps.map(step => (
            <div key={step.id} className={`flex items-start gap-4 transition-all duration-300 ${step.completed ? 'opacity-40' : currentStep === step.id ? 'opacity-100 scale-[1.02]' : 'opacity-20'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${step.completed ? 'bg-blue-600 border-blue-600 text-white' : currentStep === step.id ? 'border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] text-blue-400' : 'border-zinc-800 text-zinc-700'}`}>
                {step.completed ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <span className="text-[9px] font-black">{step.id}</span>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className={`text-[10px] font-black uppercase tracking-tight ${step.completed ? 'text-zinc-400 line-through' : currentStep === step.id ? 'text-white' : 'text-zinc-600'}`}>{step.label}</span>
                {currentStep === step.id && (
                  <span className="text-[9px] text-blue-400/80 font-bold leading-tight animate-in fade-in slide-in-from-left-1">{step.desc}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {currentStep === 5 && (
          <div className="bg-green-600/20 border border-green-500/30 p-3 rounded-xl animate-in zoom-in-95 duration-500">
             <span className="text-[9px] font-black text-green-400 uppercase tracking-widest flex items-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
               Workflow Mastery Confirmed
             </span>
          </div>
        )}

        <button 
          onClick={resetDemo}
          className="w-full py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[9px] font-black text-zinc-500 hover:text-white hover:border-zinc-700 transition-all uppercase tracking-[0.2em]"
        >
          Reset Demo
        </button>
      </div>
    </div>
  );
};

const PipelineHeader: React.FC = () => {
  const { 
    activeAdapterId, 
    availableAdapters, 
    simController, 
    busState, 
    isTruthMode, 
    setTruthMode, 
    startDemoPipeline,
    nodes,
    selection,
    validation
  } = useDataStore();

  const isSimRunning = simController.status === 'running';
  const isSimPaused = simController.status === 'paused';

  // ITEM 34: Derived step for highlighting
  const currentStep = useMemo(() => {
    if (simController.status === 'idle') return 1;
    if (selection.id === null) return 2;
    if (validation.status !== 'pass') return 3;
    if (!isTruthMode) return 4;
    return 5;
  }, [simController.status, selection.id, validation.status, isTruthMode]);

  return (
    <div className={`h-12 border-b flex items-center justify-between px-6 shrink-0 z-[70] transition-colors duration-500 ${isTruthMode ? 'bg-zinc-950 border-blue-900/50' : 'bg-zinc-900 border-zinc-800'}`}>
      <style>{`
        @keyframes subtle-pulse-blue {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
          50% { box-shadow: 0 0 15px 2px rgba(59, 130, 246, 0.4); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        .highlight-guide {
          animation: subtle-pulse-blue 2s infinite ease-in-out;
          border-color: rgba(59, 130, 246, 0.6) !important;
        }
      `}</style>
      
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

        {!isTruthMode && simController.status === 'idle' && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={startDemoPipeline}
            className="h-7 text-[10px] font-black uppercase tracking-widest border-blue-500/30 text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-blue-900/10"
          >
            Run Demo
          </Button>
        )}
        
        <div className="flex items-center gap-4">
           <div className={`w-2 h-2 rounded-full ${isSimRunning ? 'bg-blue-500 animate-pulse' : isSimPaused ? 'bg-amber-500' : 'bg-zinc-700'}`}></div>
           <span className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
             {isSimRunning ? `SIM: ${simController.mode || 'ACTIVE'}` : isSimPaused ? 'SIM: PAUSED' : 'Simulation Standby'}
           </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 px-3 py-1 bg-black/40 border border-zinc-800 rounded-lg">
           <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Flow:</span>
           <span className="text-[10px] font-mono font-bold text-blue-400">{nodes.length} Nodes</span>
        </div>

        {/* Truth Mode Toggle (Step 4 Highlight) */}
        <div 
          className={`flex items-center gap-3 px-4 py-1.5 bg-black border border-zinc-800 rounded-full group cursor-pointer hover:border-blue-500/50 transition-all ${currentStep === 4 ? 'highlight-guide' : ''}`} 
          onClick={() => setTruthMode(!isTruthMode)}
        >
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

      <GoldenDemoCoach />
    </div>
  );
};

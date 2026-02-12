
import React, { useState, useEffect } from 'react';
import { StudioShell } from './features/studio';
import { GameControl } from './features/game-control';
import { LivePreview } from './features/output';
import { NodeCanvas, DataDictionaryBrowser } from './features/data-engine';
import { ErrorBoundary } from './shared/components/ErrorBoundary';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'studio' | 'control' | 'output' | 'data'>('studio');

  useEffect(() => {
    console.log('[Renderless] App Initializing...');
    console.log('[Renderless] Active Tab:', activeTab);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      <header className="h-16 shrink-0 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6 z-[60]">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-xl shadow-blue-600/20 rotate-3 transition-transform hover:rotate-0">R</div>
            <div>
               <h1 className="font-bold tracking-tighter text-xl leading-none">RENDERLESS</h1>
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-500">Live Engine</span>
            </div>
          </div>
          
          <nav className="flex gap-1 bg-black/30 p-1 rounded-xl border border-zinc-800">
            {[
              { id: 'studio', label: 'Studio' },
              { id: 'control', label: 'Control' },
              { id: 'data', label: 'Data Engine' },
              { id: 'output', label: 'Output' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${activeTab === tab.id ? 'bg-zinc-800 text-blue-400 shadow-inner' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
           <div className="flex flex-col items-end">
             <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
               Systems Online
             </span>
             <span className="text-[9px] font-mono text-zinc-600 uppercase">124 FPS | Cluster Alpha</span>
           </div>
           <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-all shadow-sm group">
             <span className="text-[10px] font-bold text-zinc-400 group-hover:text-blue-400 transition-colors">RD</span>
           </div>
        </div>
      </header>

      {/* Main content area with diagnostic border (temporarily applied as per request) */}
      <main className="flex-1 overflow-hidden relative border-4 border-red-600/10">
        <ErrorBoundary key={`boundary-${activeTab}`} featureName={activeTab.toUpperCase()}>
          {activeTab === 'studio' && <StudioShell />}
          {activeTab === 'control' && <GameControl />}
          {activeTab === 'data' && (
            <div className="flex h-full overflow-hidden">
              <DataDictionaryBrowser />
              <NodeCanvas />
            </div>
          )}
          {activeTab === 'output' && <LivePreview />}
        </ErrorBoundary>
      </main>

      <footer className="h-6 shrink-0 bg-zinc-900 border-t border-zinc-800 flex items-center px-4 justify-between text-[10px] font-mono text-zinc-600">
        <div className="flex gap-4">
          <span>ENV: Production v2.0.4-stable</span>
          <span className="text-zinc-700">|</span>
          <span>Org: Red Bull Media House</span>
        </div>
        <div className="flex gap-4 items-center uppercase tracking-widest font-bold text-zinc-700">
          <span>RDLSS-6782-SYS</span>
        </div>
      </footer>
    </div>
  );
};

export default App;

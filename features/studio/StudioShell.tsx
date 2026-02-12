
import React from 'react';
import { useStudioStore } from './store/useStudioStore';
import { LayerSidebar } from './components/LayerSidebar';
import { Workspace } from './components/Workspace';
import { InspectorSidebar } from './components/InspectorSidebar';
import { RESOLUTIONS } from '../../shared/types';

export const StudioShell: React.FC = () => {
  const { ui, currentTemplate, setResolution } = useStudioStore();

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-zinc-950">
      {/* Studio Header (48px) */}
      <header className="h-12 shrink-0 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Design Mode</span>
          </div>
          <div className="h-4 w-px bg-zinc-800"></div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-100">{currentTemplate?.metadata.name}</span>
            <span className="text-[10px] text-zinc-600 font-mono">v{currentTemplate?.version}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-black p-1 rounded-lg border border-zinc-800 shadow-inner">
          {(Object.keys(RESOLUTIONS) as Array<keyof typeof RESOLUTIONS>).map((res) => (
            <button
              key={res}
              onClick={() => setResolution(res)}
              className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${ui.activeResolution === res ? 'bg-zinc-800 text-blue-400 shadow-sm' : 'text-zinc-600 hover:text-zinc-400'}`}
            >
              {RESOLUTIONS[res].ratio}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest">Share</button>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-600/10">Export</button>
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {ui.leftPanelOpen && <LayerSidebar />}
        <Workspace />
        {ui.rightPanelOpen && <InspectorSidebar />}
      </div>
    </div>
  );
};


import React from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { LayerType } from '../../../shared/types';
import { Button } from '../../../shared/components/Button';

export const LayerSidebar: React.FC = () => {
  const { currentTemplate, selection, selectLayer, addLayer, removeLayer } = useStudioStore();
  const selectedLayerId = selection.selectedLayerId;

  if (!currentTemplate) return null;

  return (
    <div className="w-[280px] h-full bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/50">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Scene Layers</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => addLayer(LayerType.TEXT)} className="w-6 h-6 p-0" title="Add Text">T</Button>
          <Button variant="ghost" size="sm" onClick={() => addLayer(LayerType.SHAPE)} className="w-6 h-6 p-0" title="Add Shape">□</Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {[...currentTemplate.layers].reverse().map((layer) => (
          <div
            key={layer.id}
            onClick={() => selectLayer(layer.id)}
            className={`
              group flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-all border
              ${selectedLayerId === layer.id 
                ? 'bg-blue-600/10 border-blue-500/50 text-blue-400' 
                : 'hover:bg-zinc-800/50 border-transparent text-zinc-400'}
            `}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-4 h-4 flex items-center justify-center text-[10px] bg-zinc-800 rounded text-zinc-500 font-bold group-hover:text-zinc-300">
                {layer.type === LayerType.TEXT ? 'T' : 'S'}
              </div>
              <span className="truncate text-xs font-medium">{layer.name}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeLayer(layer.id);
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};


import React from 'react';
import { useStudioStore } from './store/useStudioStore';
import { LayerType } from '../../shared/types';
import { Button } from '../../shared/components/Button';

export const LayerPanel: React.FC = () => {
  // Fix: Access selectedLayerId from selection object in the latest StudioState schema
  const { currentTemplate, selection, selectLayer, addLayer, removeLayer } = useStudioStore();
  const selectedLayerId = selection.selectedLayerId;

  if (!currentTemplate) return null;

  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
        <h3 className="font-semibold text-zinc-400 uppercase text-xs tracking-wider">Layers</h3>
        <div className="flex gap-1">
           <Button variant="ghost" size="sm" onClick={() => addLayer(LayerType.TEXT)} title="Add Text">
            T
           </Button>
           <Button variant="ghost" size="sm" onClick={() => addLayer(LayerType.SHAPE)} title="Add Shape">
             □
           </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {[...currentTemplate.layers].reverse().map((layer) => (
          <div
            key={layer.id}
            onClick={() => selectLayer(layer.id)}
            className={`
              group flex items-center justify-between p-2 rounded cursor-pointer transition-colors
              ${selectedLayerId === layer.id ? 'bg-blue-600 text-white' : 'hover:bg-zinc-800 text-zinc-400'}
            `}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-xs opacity-50">
                {layer.type === LayerType.TEXT ? 'T' : layer.type === LayerType.IMAGE ? 'I' : 'S'}
              </span>
              <span className="truncate text-sm">{layer.name}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeLayer(layer.id);
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-red-400 px-1"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

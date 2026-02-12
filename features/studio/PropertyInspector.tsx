
import React from 'react';
import { useStudioStore } from './store/useStudioStore';
import { LogicLayer, LayerType } from '../../shared/types';

export const PropertyInspector: React.FC = () => {
  // Fix: Access selectedLayerId from selection object in the latest StudioState schema
  const { currentTemplate, selection, updateLayerTransform, updateLayerContent, setBinding, updateTemplateMetadata } = useStudioStore();
  const selectedLayerId = selection.selectedLayerId;

  const layer = currentTemplate?.layers.find(l => l.id === selectedLayerId);

  if (!currentTemplate) return null;

  if (!layer) {
    return (
      <div className="w-80 bg-zinc-900 border-l border-zinc-800 p-6 flex flex-col gap-6 overflow-y-auto">
        <section>
          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Template Settings</h4>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">Logic Layer</label>
              <select 
                value={currentTemplate.metadata.logicLayer}
                onChange={(e) => updateTemplateMetadata({ logicLayer: e.target.value as LogicLayer })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white"
              >
                {Object.values(LogicLayer).map(ll => <option key={ll} value={ll}>{ll.toUpperCase()}</option>)}
              </select>
            </div>
          </div>
        </section>
        <div className="mt-auto p-4 border border-zinc-800 bg-zinc-800/30 rounded-xl">
          <p className="text-[10px] text-zinc-500 italic text-center">Select a layer to edit properties</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-zinc-900 border-l border-zinc-800 p-6 flex flex-col gap-6 overflow-y-auto">
      <section>
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Transform</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">X</label>
            <input 
              type="number" 
              value={Math.round(layer.transform.x)}
              onChange={(e) => updateLayerTransform(layer.id, { x: parseInt(e.target.value) })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" 
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Y</label>
            <input 
              type="number" 
              value={Math.round(layer.transform.y)}
              onChange={(e) => updateLayerTransform(layer.id, { y: parseInt(e.target.value) })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" 
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Width</label>
            <input 
              type="number" 
              value={Math.round(layer.transform.width)}
              onChange={(e) => updateLayerTransform(layer.id, { width: parseInt(e.target.value) })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" 
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Height</label>
            <input 
              type="number" 
              value={Math.round(layer.transform.height)}
              onChange={(e) => updateLayerTransform(layer.id, { height: parseInt(e.target.value) })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" 
            />
          </div>
        </div>
      </section>

      <section>
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Content</h4>
        {layer.type === LayerType.TEXT ? (
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">Text Value</label>
              <input 
                type="text" 
                value={layer.content.text}
                onChange={(e) => updateLayerContent(layer.id, { text: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs" 
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-400 block mb-1">Color</label>
              <input 
                type="color" 
                value={layer.content.color}
                onChange={(e) => updateLayerContent(layer.id, { color: e.target.value })}
                className="w-full h-8 bg-zinc-800 border border-zinc-700 rounded p-1" 
              />
            </div>
          </div>
        ) : layer.type === LayerType.SHAPE ? (
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Fill Color</label>
            <input 
              type="color" 
              value={layer.content.color}
              onChange={(e) => updateLayerContent(layer.id, { color: e.target.value })}
              className="w-full h-8 bg-zinc-800 border border-zinc-700 rounded p-1" 
            />
          </div>
        ) : null}
      </section>

      <section>
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Data Binding</h4>
        <div>
          <label className="text-[10px] text-zinc-400 block mb-1">Source Path (e.g. game.home.score)</label>
          <input 
            type="text" 
            placeholder="No binding"
            // bindings is Record<string, string>, so we access it directly as a string
            value={currentTemplate.bindings[`${layer.id}.${layer.type === LayerType.TEXT ? 'text' : 'color'}`] || ''}
            onChange={(e) => setBinding(layer.id, layer.type === LayerType.TEXT ? 'text' : 'color', e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-blue-400 font-mono" 
          />
        </div>
      </section>
    </div>
  );
};

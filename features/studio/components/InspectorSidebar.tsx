
import React from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { LogicLayer, LayerType } from '../../../shared/types';

export const InspectorSidebar: React.FC = () => {
  const { 
    currentTemplate, 
    selection, 
    updateLayerTransform, 
    updateLayerContent, 
    setBinding, 
    updateTemplateMetadata 
  } = useStudioStore();

  const selectedLayerId = selection.selectedLayerId;
  const layer = currentTemplate?.layers.find(l => l.id === selectedLayerId);

  if (!currentTemplate) return null;

  if (!layer) {
    return (
      <div className="w-[320px] h-full bg-zinc-900 border-l border-zinc-800 flex flex-col">
        <div className="h-12 border-b border-zinc-800 flex items-center px-4">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Inspector</span>
        </div>
        <div className="p-6 space-y-8 overflow-y-auto">
          <section>
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Template Settings</h4>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1.5 uppercase font-medium">Logic Layer</label>
                <select 
                  value={currentTemplate.metadata.logicLayer}
                  onChange={(e) => updateTemplateMetadata({ logicLayer: e.target.value as LogicLayer })}
                  className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
                >
                  {Object.values(LogicLayer).map(ll => <option key={ll} value={ll}>{ll.toUpperCase()}</option>)}
                </select>
              </div>
            </div>
          </section>
          <div className="flex flex-col items-center justify-center pt-12 text-center opacity-20">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            <p className="text-xs italic">Select a layer to adjust properties</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[320px] h-full bg-zinc-900 border-l border-zinc-800 flex flex-col">
      <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Layer Properties</span>
        <span className="text-[9px] font-mono text-zinc-600">#{layer.id.split('-')[1]}</span>
      </div>
      
      <div className="p-6 space-y-8 overflow-y-auto">
        <section>
          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Transform</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {[
              { label: 'X', key: 'x' },
              { label: 'Y', key: 'y' },
              { label: 'W', key: 'width' },
              { label: 'H', key: 'height' }
            ].map((prop) => (
              <div key={prop.label}>
                <label className="text-[10px] text-zinc-500 block mb-1 uppercase">{prop.label}</label>
                <input 
                  type="number" 
                  value={Math.round(layer.transform[prop.key as keyof typeof layer.transform] as number)}
                  onChange={(e) => updateLayerTransform(layer.id, { [prop.key]: parseInt(e.target.value) })}
                  className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-xs text-blue-400 focus:border-blue-500 outline-none font-mono" 
                />
              </div>
            ))}
          </div>
        </section>

        <section>
          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Style</h4>
          {layer.type === LayerType.TEXT ? (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-zinc-500 block mb-1 uppercase font-medium">Text Value</label>
                <textarea 
                  value={layer.content.text}
                  onChange={(e) => updateLayerContent(layer.id, { text: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:border-blue-500 outline-none min-h-[60px]" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1 uppercase font-medium">Size</label>
                  <input 
                    type="number" 
                    value={layer.content.fontSize}
                    onChange={(e) => updateLayerContent(layer.id, { fontSize: parseInt(e.target.value) })}
                    className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-xs text-white" 
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1 uppercase font-medium">Color</label>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded border border-zinc-800 shrink-0" style={{ backgroundColor: layer.content.color }} />
                    <input 
                      type="text" 
                      value={layer.content.color}
                      onChange={(e) => updateLayerContent(layer.id, { color: e.target.value })}
                      className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-xs text-white font-mono uppercase" 
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-[10px] text-zinc-500 block mb-1 uppercase font-medium">Fill Color</label>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded border border-zinc-800 shrink-0" style={{ backgroundColor: (layer as any).content.color }} />
                <input 
                  type="text" 
                  value={(layer as any).content.color}
                  onChange={(e) => updateLayerContent(layer.id, { color: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-xs text-white font-mono uppercase" 
                />
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Data Binding</h4>
            <div className={`w-1.5 h-1.5 rounded-full ${currentTemplate.bindings[`${layer.id}.${layer.type === LayerType.TEXT ? 'text' : 'color'}`] ? 'bg-blue-500' : 'bg-zinc-700'}`}></div>
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1 uppercase font-medium">Dictionary Path</label>
            <input 
              type="text" 
              placeholder="e.g. game.home.score"
              value={currentTemplate.bindings[`${layer.id}.${layer.type === LayerType.TEXT ? 'text' : 'color'}`] || ''}
              onChange={(e) => setBinding(layer.id, layer.type === LayerType.TEXT ? 'text' : 'color', e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-xs text-blue-400 font-mono focus:border-blue-500 outline-none" 
            />
          </div>
        </section>
      </div>
    </div>
  );
};

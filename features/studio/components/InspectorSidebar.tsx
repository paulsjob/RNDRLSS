
import React from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { LogicLayer, LayerType } from '../../../shared/types';
import { useLiveValue } from '../../../shared/data-runtime/hooks';
import { MLB_CANON_DICTIONARY } from '../../../contract/dictionaries/mlb';
import { applyTransforms } from '../../../contract/transforms';

// Internal helper for displaying live value in the inspector
const LiveValueDisplay: React.FC<{ keyId: string; transforms: string[] }> = ({ keyId, transforms }) => {
  const record = useLiveValue(keyId);
  const dictionaryKey = MLB_CANON_DICTIONARY.keys.find(k => k.keyId === keyId);
  
  const rawValue = record?.value ?? '—';
  const resolvedValue = record ? applyTransforms(record.value, transforms) : '—';

  return (
    <div className="mt-3 bg-black/40 border border-blue-900/20 rounded p-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[9px] text-zinc-500 uppercase font-black tracking-tighter">Live Monitor</span>
        {record && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>}
      </div>
      
      <div className="flex flex-col">
        <span className="text-[10px] text-zinc-400 font-medium">{dictionaryKey?.alias || 'Unknown Key'}</span>
        <span className="text-[12px] text-blue-400 font-mono font-bold truncate">
          {typeof resolvedValue === 'object' ? JSON.stringify(resolvedValue) : String(resolvedValue)}
        </span>
      </div>

      {transforms.length > 0 && (
        <div className="flex flex-col border-t border-zinc-800/50 pt-2">
          <span className="text-[8px] text-zinc-600 uppercase font-bold mb-1">Raw: {String(rawValue)}</span>
          <div className="flex flex-wrap gap-1">
            {transforms.map(t => (
              <span key={t} className="px-1 py-0.5 bg-zinc-800 text-zinc-500 text-[8px] rounded uppercase">{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

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

  // Get current binding for content/text
  const bindingKey = `${layer.id}.${layer.type === LayerType.TEXT ? 'text' : 'color'}`;
  const boundKeyId = currentTemplate.bindings[bindingKey] || '';

  return (
    <div className="w-[320px] h-full bg-zinc-900 border-l border-zinc-800 flex flex-col">
      <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Layer Properties</span>
        <span className="text-[9px] font-mono text-zinc-600">#{layer.id.split('-')[1]}</span>
      </div>
      
      <div className="p-6 space-y-8 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
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
            <div className={`w-1.5 h-1.5 rounded-full ${boundKeyId ? 'bg-blue-500' : 'bg-zinc-700'}`}></div>
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 block mb-1 uppercase font-medium">Contract Key ID (ULID)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="01HS..."
                value={boundKeyId}
                onChange={(e) => setBinding(layer.id, layer.type === LayerType.TEXT ? 'text' : 'color', e.target.value)}
                className="flex-1 bg-black border border-zinc-800 rounded px-3 py-2 text-xs text-blue-400 font-mono focus:border-blue-500 outline-none" 
              />
              <select 
                onChange={(e) => {
                  if (e.target.value) setBinding(layer.id, layer.type === LayerType.TEXT ? 'text' : 'color', e.target.value);
                }}
                className="w-10 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-400"
              >
                <option value="">+</option>
                {MLB_CANON_DICTIONARY.keys.map(k => (
                  <option key={k.keyId} value={k.keyId}>{k.alias}</option>
                ))}
              </select>
            </div>
            
            {/* Safe Live Value Preview */}
            {boundKeyId && (
              <LiveValueDisplay 
                keyId={boundKeyId} 
                transforms={[]} 
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

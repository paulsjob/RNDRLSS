
import React, { useState, useMemo } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { LogicLayer, LayerType } from '../../../shared/types';
import { useLiveValue } from '../../../shared/data-runtime/hooks';
import { MLB_CANON_DICTIONARY } from '../../../contract/dictionaries/mlb';
import { applyTransforms } from '../../../contract/transforms';
import { KeyPicker } from '../../../shared/components/KeyPicker';
import { useDataStore } from '../../data-engine/store/useDataStore';
import { Dictionary } from '../../../contract/types';

// Internal helper for displaying live value and resolved state in the inspector
const LiveValuePreview: React.FC<{ keyId: string; transforms: string[] }> = ({ keyId, transforms }) => {
  const record = useLiveValue(keyId);
  
  const rawValue = record?.value ?? null;
  const resolvedValue = record ? applyTransforms(record.value, transforms) : '—';

  return (
    <div className="mt-4 bg-black/40 border border-zinc-800 rounded p-4 space-y-4 animate-in fade-in duration-300">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
        <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${record ? 'bg-blue-500 animate-pulse' : 'bg-zinc-700'}`}></div>
          Resolved Preview
        </span>
        <span className="text-[9px] text-zinc-600 font-mono">Source: {record?.sourceId || 'None'}</span>
      </div>
      
      <div className="flex flex-col gap-1">
        <span className="text-[9px] text-zinc-600 uppercase font-bold">Current Output</span>
        <div className="bg-zinc-900/80 rounded p-2 border border-zinc-800/50">
          <span className="text-[13px] text-blue-400 font-mono font-bold block break-all leading-tight">
            {typeof resolvedValue === 'object' ? JSON.stringify(resolvedValue) : String(resolvedValue)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] text-zinc-600 uppercase font-black">Raw Inbound</span>
          <span className="text-[10px] text-zinc-400 font-mono truncate">
            {rawValue !== null ? String(rawValue) : 'N/A'}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] text-zinc-600 uppercase font-black">Last Update</span>
          <span className="text-[10px] text-zinc-400 font-mono">
            {record ? `${Math.round((Date.now() - record.ts)/1000)}s ago` : 'Never'}
          </span>
        </div>
      </div>
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
  
  // ITEM 09: Pull dictionary list from Data Engine store
  const { builtinDictionaries, importedDictionaries } = useDataStore();
  const allDictionaries = useMemo(() => [...builtinDictionaries, ...importedDictionaries], [builtinDictionaries, importedDictionaries]);

  const [isBindingMode, setIsBindingMode] = useState(false);

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
        </div>
      </div>
    );
  }

  const bindingKey = `${layer.id}.${layer.type === LayerType.TEXT ? 'text' : 'color'}`;
  const boundKeyId = currentTemplate.bindings[bindingKey] || '';

  return (
    <div className="w-[320px] h-full bg-zinc-900 border-l border-zinc-800 flex flex-col">
      <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Layer Properties</span>
        <span className="text-[9px] font-mono text-zinc-600">#{layer.id.split('-')[1]}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800">
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
                <label className="text-[10px] text-zinc-500 block mb-1 uppercase tracking-tighter">{prop.label}</label>
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

        <section className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-800 -mx-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Live Binding</h4>
            <button 
              onClick={() => setIsBindingMode(!isBindingMode)}
              className="text-[9px] font-bold text-zinc-500 hover:text-zinc-300 uppercase underline decoration-zinc-700"
            >
              {isBindingMode ? 'Done' : 'Change Key'}
            </button>
          </div>
          
          <div className="space-y-4">
            {isBindingMode ? (
              <KeyPicker 
                dictionaries={allDictionaries as unknown as Dictionary[]}
                selectedKeyId={boundKeyId}
                onSelect={(id) => {
                  setBinding(layer.id, layer.type === LayerType.TEXT ? 'text' : 'color', id);
                  setIsBindingMode(false);
                }}
              />
            ) : (
              <>
                {!boundKeyId ? (
                  <div className="py-4 text-center border-2 border-dashed border-zinc-800 rounded-lg">
                    <button 
                      onClick={() => setIsBindingMode(true)}
                      className="text-[10px] font-bold text-blue-500 border border-blue-500/30 px-3 py-1.5 rounded hover:bg-blue-500/5"
                    >
                      Browse Dictionary
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-black/60 rounded px-3 py-2 flex items-center justify-between group">
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[11px] text-blue-400 font-bold truncate">
                          {allDictionaries.flatMap(d => d.keys).find(k => k.keyId === boundKeyId)?.alias || 'Unknown Key'}
                        </span>
                      </div>
                      <button 
                        onClick={() => setBinding(layer.id, layer.type === LayerType.TEXT ? 'text' : 'color', null)}
                        className="p-1.5 text-zinc-700 hover:text-red-500 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {boundKeyId && !isBindingMode && (
              <LiveValuePreview 
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


import React, { useState, useMemo, useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { LogicLayer, LayerType } from '../../../shared/types';
import { useLiveValue } from '../../../shared/data-runtime/hooks';
import { applyTransforms } from '../../../contract/transforms';
import { KeyPicker } from '../../../shared/components/KeyPicker';
import { dictionaryRegistry } from '../../../shared/data-runtime/DictionaryRegistry';
import { Dictionary } from '../../../contract/types';

// Internal helper for displaying live value and resolved state in the inspector
const LiveValuePreview: React.FC<{ keyId: string; transforms: string[] }> = ({ keyId, transforms }) => {
  const record = useLiveValue(keyId);
  const lookup = useMemo(() => dictionaryRegistry.getKey(keyId), [keyId]);
  
  const rawValue = record?.value ?? null;
  const resolvedValue = record ? applyTransforms(record.value, transforms) : '—';

  return (
    <div className="mt-4 bg-black/60 border border-zinc-800 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-2.5">
        <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${record ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse' : 'bg-zinc-700'}`}></div>
          Resolved Preview
        </span>
        <span className="text-[9px] text-zinc-700 font-mono tracking-tighter">
          {record ? `SEQ:${record.seq}` : 'AWAITING DATA'}
        </span>
      </div>

      {!lookup && (
        <div className="flex items-center gap-2 p-2 bg-red-950/20 border border-red-500/30 rounded-lg text-red-400 text-[9px] font-bold italic">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Warning: Binding refers to missing keyId
        </div>
      )}
      
      <div className="flex flex-col gap-1.5">
        <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Calculated Result</span>
        <div className="bg-zinc-900/90 rounded-lg p-3 border border-zinc-800/50 shadow-inner group">
          <span className="text-[15px] text-blue-400 font-mono font-black block break-all leading-none">
            {typeof resolvedValue === 'object' ? JSON.stringify(resolvedValue) : String(resolvedValue)}
          </span>
          <div className="mt-2 h-0.5 w-0 group-hover:w-full bg-blue-500/30 transition-all duration-700"></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] text-zinc-700 uppercase font-black tracking-tighter">Inbound Value</span>
          <span className="text-[10px] text-zinc-400 font-mono truncate bg-zinc-800/20 px-1 py-0.5 rounded">
            {rawValue !== null ? (typeof rawValue === 'object' ? '{...}' : String(rawValue)) : 'NULL'}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] text-zinc-700 uppercase font-black tracking-tighter">Latency</span>
          <span className="text-[10px] text-zinc-400 font-mono tabular-nums">
            {record ? `${((Date.now() - record.ts)/1000).toFixed(1)}s` : '∞'}
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
  
  // Sync dictionary registry for lookup safety
  const [availableDicts, setAvailableDicts] = useState<Dictionary[]>([]);
  useEffect(() => {
    setAvailableDicts(dictionaryRegistry.listDictionaries());
  }, []);

  const [isBindingMode, setIsBindingMode] = useState(false);

  const selectedLayerId = selection.selectedLayerId;
  const layer = currentTemplate?.layers.find(l => l.id === selectedLayerId);

  if (!currentTemplate) return null;

  if (!layer) {
    return (
      <div className="w-[320px] h-full bg-zinc-900 border-l border-zinc-800 flex flex-col">
        <div className="h-12 border-b border-zinc-800 flex items-center px-4 bg-zinc-900/50">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Global Settings</span>
        </div>
        <div className="p-6 space-y-8 overflow-y-auto">
          <section className="bg-zinc-800/20 p-4 rounded-xl border border-zinc-800/50">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
              Display Hierarchy
            </h4>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] text-zinc-600 block mb-1.5 uppercase font-black tracking-widest">Logic Layer (Z-Index)</label>
                <select 
                  value={currentTemplate.metadata.logicLayer}
                  onChange={(e) => updateTemplateMetadata({ logicLayer: e.target.value as LogicLayer })}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none hover:border-zinc-700 transition-colors"
                >
                  {Object.values(LogicLayer).map(ll => <option key={ll} value={ll}>{ll.toUpperCase()}</option>)}
                </select>
              </div>
            </div>
          </section>
          
          <div className="text-center py-12 px-8">
            <div className="w-12 h-12 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <p className="text-[11px] text-zinc-600 font-medium italic">Select a layer on the canvas to inspect its live data properties.</p>
          </div>
        </div>
      </div>
    );
  }

  const bindingKey = `${layer.id}.${layer.type === LayerType.TEXT ? 'text' : 'color'}`;
  const boundKeyId = currentTemplate.bindings[bindingKey] || '';
  const boundLookup = boundKeyId ? dictionaryRegistry.getKey(boundKeyId) : null;

  return (
    <div className="w-[320px] h-full bg-zinc-900 border-l border-zinc-800 flex flex-col">
      <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Inspector</span>
        </div>
        <span className="text-[9px] font-mono text-zinc-600 font-bold uppercase tracking-tighter bg-black px-1.5 py-0.5 rounded border border-zinc-800">
          ID:{layer.id.split('-').slice(-1)}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Transform</h4>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {[
              { label: 'X (Pixels)', key: 'x' },
              { label: 'Y (Pixels)', key: 'y' },
              { label: 'W (Width)', key: 'width' },
              { label: 'H (Height)', key: 'height' }
            ].map((prop) => (
              <div key={prop.label}>
                <label className="text-[9px] text-zinc-600 block mb-1 uppercase font-black tracking-tighter">{prop.label}</label>
                <input 
                  type="number" 
                  value={Math.round(layer.transform[prop.key as keyof typeof layer.transform] as number)}
                  onChange={(e) => updateLayerTransform(layer.id, { [prop.key]: parseInt(e.target.value) })}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-blue-400 focus:border-blue-500 outline-none font-mono hover:border-zinc-700 transition-colors" 
                />
              </div>
            ))}
          </div>
        </section>

        <section className="bg-blue-600/5 p-4 rounded-2xl border border-blue-500/10 -mx-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Live Binding</h4>
            </div>
            <button 
              onClick={() => setIsBindingMode(!isBindingMode)}
              className="text-[9px] font-bold text-zinc-500 hover:text-blue-400 uppercase tracking-widest transition-colors flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 5-3-3H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
              {isBindingMode ? 'Cancel' : 'Configure'}
            </button>
          </div>
          
          <div className="space-y-4">
            {isBindingMode ? (
              <KeyPicker 
                dictionaries={availableDicts}
                selectedKeyId={boundKeyId}
                onSelect={(id) => {
                  setBinding(layer.id, layer.type === LayerType.TEXT ? 'text' : 'color', id);
                  setIsBindingMode(false);
                }}
              />
            ) : (
              <>
                {!boundKeyId ? (
                  <div className="py-6 text-center border-2 border-dashed border-zinc-800/50 rounded-xl bg-black/20 group hover:border-blue-500/30 transition-all">
                    <button 
                      onClick={() => setIsBindingMode(true)}
                      className="text-[10px] font-black text-zinc-500 group-hover:text-blue-500 px-4 py-2 rounded-lg border border-zinc-800 group-hover:border-blue-500/30 bg-zinc-900 group-hover:bg-blue-500/5 transition-all uppercase tracking-widest"
                    >
                      Connect to Bus
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className={`bg-zinc-950 rounded-xl px-4 py-3 flex items-center justify-between group border transition-all ${boundLookup ? 'border-zinc-800 hover:border-blue-500/30' : 'border-red-900/50 hover:border-red-500/50'}`}>
                      <div className="flex flex-col overflow-hidden">
                        <span className={`text-[11px] font-black truncate tracking-tight ${boundLookup ? 'text-blue-400' : 'text-zinc-600 italic'}`}>
                          {boundLookup?.key.alias || 'Broken Reference'}
                        </span>
                        <span className="text-[8px] text-zinc-600 font-mono mt-0.5 truncate uppercase">
                          Source: {boundLookup?.dictionary.dictionaryId.split('.').slice(-1) || 'Unknown'}
                        </span>
                      </div>
                      <button 
                        onClick={() => setBinding(layer.id, layer.type === LayerType.TEXT ? 'text' : 'color', null)}
                        className="p-2 text-zinc-700 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
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

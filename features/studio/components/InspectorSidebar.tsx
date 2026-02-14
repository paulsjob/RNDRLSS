
import React, { useState, useMemo, useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { useDataStore } from '../../data-engine/store/useDataStore';
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
    <div className="mt-4 bg-black/60 border border-zinc-800 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-bottom-1 duration-300 shadow-2xl">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-2.5">
        <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${record ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse' : 'bg-zinc-700'}`}></div>
          Resolved Stream
        </span>
        <span className="text-[9px] text-zinc-700 font-mono tracking-tighter">
          {record ? `SEQ:${record.seq % 10000}` : 'AWAITING BUS'}
        </span>
      </div>

      {!lookup && (
        <div className="flex items-center gap-2 p-2.5 bg-red-950/20 border border-red-500/30 rounded-lg text-red-400 text-[9px] font-bold leading-tight">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Warning: Missing key definition in current org registry.
        </div>
      )}
      
      <div className="flex flex-col gap-2">
        <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Calculated Output</span>
        <div className="bg-zinc-900/90 rounded-lg p-3.5 border border-zinc-800/50 shadow-inner group transition-all hover:border-blue-500/30">
          <span className="text-[16px] text-blue-400 font-mono font-black block break-all leading-none tracking-tight">
            {typeof resolvedValue === 'object' ? JSON.stringify(resolvedValue) : String(resolvedValue)}
          </span>
          <div className="mt-3 h-0.5 w-0 group-hover:w-full bg-blue-500/40 transition-all duration-500"></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-1 border-t border-zinc-800/30">
        <div className="flex flex-col gap-1">
          <span className="text-[8px] text-zinc-700 uppercase font-black tracking-tighter">Native Input</span>
          <span className="text-[10px] text-zinc-400 font-mono truncate bg-zinc-800/20 px-1.5 py-0.5 rounded border border-zinc-800/30">
            {rawValue !== null ? (typeof rawValue === 'object' ? '{...}' : String(rawValue)) : 'NULL'}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[8px] text-zinc-700 uppercase font-black tracking-tighter">Sync Delta</span>
          <span className="text-[10px] text-zinc-400 font-mono tabular-nums bg-zinc-800/20 px-1.5 py-0.5 rounded border border-zinc-800/30">
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

  const { orgId } = useDataStore();
  const [selectedTransform, setSelectedTransform] = useState<string>('none');
  
  // Sync dictionary registry for lookup safety
  const [availableDicts, setAvailableDicts] = useState<Dictionary[]>([]);
  useEffect(() => {
    dictionaryRegistry.setOrgId(orgId);
    setAvailableDicts(dictionaryRegistry.listDictionaries());

    const unsub = dictionaryRegistry.subscribe(() => {
      setAvailableDicts(dictionaryRegistry.listDictionaries());
    });
    return unsub;
  }, [orgId]);

  const [isBindingMode, setIsBindingMode] = useState(false);

  const selectedLayerId = selection.selectedLayerId;
  const layer = currentTemplate?.layers.find(l => l.id === selectedLayerId);

  if (!currentTemplate) return null;

  if (!layer) {
    return (
      <div className="w-[320px] h-full bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-2xl">
        <div className="h-12 border-b border-zinc-800 flex items-center px-4 bg-zinc-900/50">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Workspace Settings</span>
        </div>
        <div className="p-6 space-y-8 overflow-y-auto">
          <section className="bg-zinc-800/20 p-5 rounded-2xl border border-zinc-800/50">
            <div className="flex items-center gap-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Engine Stack</h4>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-black/40 rounded-xl border border-zinc-800">
                <span className="text-[9px] text-zinc-600 block mb-1 uppercase font-black tracking-widest">Active Org Scope</span>
                <span className="text-xs font-bold text-blue-400 font-mono uppercase tracking-tight">{orgId}</span>
              </div>
              <div>
                <label className="text-[9px] text-zinc-600 block mb-1.5 uppercase font-black tracking-widest">Logic Tier (Z-Index)</label>
                <select 
                  value={currentTemplate.metadata.logicLayer}
                  onChange={(e) => updateTemplateMetadata({ logicLayer: e.target.value as LogicLayer })}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:border-blue-500 outline-none hover:border-zinc-700 transition-colors cursor-pointer"
                >
                  {Object.values(LogicLayer).map(ll => <option key={ll} value={ll}>{ll.toUpperCase()}</option>)}
                </select>
              </div>
            </div>
          </section>
          
          <div className="text-center py-16 px-8 flex flex-col items-center">
            <div className="w-14 h-14 bg-zinc-800/30 rounded-2xl flex items-center justify-center mb-6 border border-zinc-800 shadow-inner group">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-700 group-hover:text-blue-500/50 transition-colors"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-2">No Layer Selection</h5>
            <p className="text-[11px] text-zinc-600 font-medium italic leading-relaxed">Select a layer on the stage to modify its properties and live data bindings.</p>
          </div>
        </div>
      </div>
    );
  }

  const bindingKey = `${layer.id}.${layer.type === LayerType.TEXT ? 'text' : 'color'}`;
  const boundKeyId = currentTemplate.bindings[bindingKey] || '';
  const boundLookup = boundKeyId ? dictionaryRegistry.getKey(boundKeyId) : null;

  const transforms = selectedTransform === 'none' ? [] : [selectedTransform];

  return (
    <div className="w-[320px] h-full bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-2xl">
      <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
          <span className="text-[10px] font-black text-zinc-100 uppercase tracking-widest">Properties</span>
        </div>
        <span className="text-[9px] font-mono text-zinc-600 font-bold uppercase tracking-tighter bg-black px-2 py-0.5 rounded border border-zinc-800/50">
          HASH:{layer.id.slice(-6).toUpperCase()}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Transformation</h4>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {[
              { label: 'X Pos', key: 'x' },
              { label: 'Y Pos', key: 'y' },
              { label: 'Width', key: 'width' },
              { label: 'Height', key: 'height' }
            ].map((prop) => (
              <div key={prop.label}>
                <label className="text-[9px] text-zinc-700 block mb-1 uppercase font-black tracking-tighter">{prop.label}</label>
                <input 
                  type="number" 
                  value={Math.round(layer.transform[prop.key as keyof typeof layer.transform] as number)}
                  onChange={(e) => updateLayerTransform(layer.id, { [prop.key]: parseInt(e.target.value) })}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-blue-400 focus:border-blue-500 outline-none font-mono hover:border-zinc-700 transition-colors shadow-inner" 
                />
              </div>
            ))}
          </div>
        </section>

        <section className="bg-blue-600/5 p-5 rounded-3xl border border-blue-500/10 -mx-2 shadow-inner">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.3)]"></div>
              <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Data Integration</h4>
            </div>
            <button 
              onClick={() => setIsBindingMode(!isBindingMode)}
              className="text-[9px] font-black text-zinc-600 hover:text-blue-400 uppercase tracking-widest transition-colors flex items-center gap-2 group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform"><path d="m18 5-3-3H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
              {isBindingMode ? 'Cancel' : 'Connect'}
            </button>
          </div>
          
          <div className="space-y-5">
            {isBindingMode ? (
              <div className="animate-in fade-in zoom-in-95 duration-200">
                <KeyPicker 
                  dictionaries={availableDicts}
                  selectedKeyId={boundKeyId}
                  onSelect={(id) => {
                    setBinding(layer.id, layer.type === LayerType.TEXT ? 'text' : 'color', id);
                    setIsBindingMode(false);
                  }}
                />
              </div>
            ) : (
              <>
                {!boundKeyId ? (
                  <div className="py-8 text-center border-2 border-dashed border-zinc-800/60 rounded-2xl bg-black/30 group hover:border-blue-500/40 transition-all cursor-pointer" onClick={() => setIsBindingMode(true)}>
                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-600 group-hover:text-white transition-colors"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                    </div>
                    <span className="text-[10px] font-black text-zinc-600 group-hover:text-blue-500 transition-colors uppercase tracking-widest">Bind Live Key</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`bg-zinc-950 rounded-2xl px-5 py-4 flex items-center justify-between group border transition-all ${boundLookup ? 'border-zinc-800 hover:border-blue-500/40 hover:bg-zinc-900' : 'border-red-900/50 bg-red-950/5 hover:border-red-500/50'}`}>
                      <div className="flex flex-col overflow-hidden gap-0.5">
                        <span className={`text-[12px] font-black truncate tracking-tight ${boundLookup ? 'text-blue-400' : 'text-zinc-600 italic'}`}>
                          {boundLookup?.key.alias || 'Orphaned Reference'}
                        </span>
                        <div className="flex items-center gap-2">
                           <span className="text-[8px] text-zinc-700 font-mono uppercase tracking-tighter">
                            Bus: {boundLookup?.dictionary.dictionaryId.split('.').slice(-1)[0] || 'Unknown'}
                          </span>
                          {boundLookup && (
                            <div className="w-1 h-1 rounded-full bg-green-500/50 animate-pulse"></div>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => setBinding(layer.id, layer.type === LayerType.TEXT ? 'text' : 'color', null)}
                        className="p-2 text-zinc-800 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Remove Binding"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] text-zinc-600 uppercase font-black tracking-widest ml-1">Live Transformer</label>
                      <select 
                        value={selectedTransform}
                        onChange={(e) => setSelectedTransform(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-[10px] font-bold text-zinc-400 focus:border-blue-500 outline-none hover:border-zinc-700 transition-colors cursor-pointer"
                      >
                        <option value="none">None (Raw Output)</option>
                        <option value="upper">UPPERCASE</option>
                        <option value="lower">lowercase</option>
                        <option value="fixed(0)">Fixed Decimals (0)</option>
                        <option value="fixed(2)">Fixed Decimals (2)</option>
                        <option value="pct">Percentage (0.5 -> 50%)</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}

            {boundKeyId && !isBindingMode && (
              <LiveValuePreview 
                keyId={boundKeyId} 
                transforms={transforms} 
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

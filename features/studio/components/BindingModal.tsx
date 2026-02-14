
import React, { useState, useMemo, useEffect } from 'react';
import { useLiveValue } from '../../../shared/data-runtime/hooks';
import { dictionaryRegistry } from '../../../shared/data-runtime/DictionaryRegistry';
import { KeyPicker } from '../../../shared/components/KeyPicker';
import { Button } from '../../../shared/components/Button';
import { applyTransforms } from '../../../contract/transforms';
import { useDataStore } from '../../data-engine/store/useDataStore';
import { MLB_KEYS } from '../../../contract/dictionaries/mlb';
import { useStudioStore } from '../store/useStudioStore';

interface BindingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (keyId: string, transform: string) => void;
  initialKeyId?: string;
  initialTransform?: string;
  targetLabel: string;
}

export const BindingModal: React.FC<BindingModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  initialKeyId = '', 
  initialTransform = 'none',
  targetLabel 
}) => {
  const [selectedKeyId, setSelectedKeyId] = useState(initialKeyId);
  const [transform, setTransform] = useState(initialTransform);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // FIX: Added searchQuery state to fix missing searchQueryPresent error
  const [searchQuery, setSearchQuery] = useState("");
  const searchQueryPresent = searchQuery.length > 0;

  const { simController, setSelection } = useDataStore();
  const { currentTemplate } = useStudioStore();

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedKeyId(initialKeyId);
      setTransform(initialTransform);
      setStep(1);
      setSearchQuery("");
    }
  }, [isOpen, initialKeyId, initialTransform]);

  const record = useLiveValue(selectedKeyId || null);
  const lookup = useMemo(() => selectedKeyId ? dictionaryRegistry.getKey(selectedKeyId) : null, [selectedKeyId]);
  
  const displayValue = useMemo(() => {
    if (!record) return '—';
    const transforms = transform === 'none' ? [] : [transform];
    return String(applyTransforms(record.value, transforms));
  }, [record, transform]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (lookup) {
      // ITEM 41: Immediately highlight the matching key in Data Engine registry for discovery
      setSelection('key', lookup.key.keyId, lookup.key.alias, lookup.key.canonicalPath);
    }
    onConfirm(selectedKeyId, transform);
  };

  const handleQuickBind = (keyId: string) => {
    const keyLookup = dictionaryRegistry.getKey(keyId);
    if (keyLookup) {
      setSelection('key', keyLookup.key.keyId, keyLookup.key.alias, keyLookup.key.canonicalPath);
    }
    onConfirm(keyId, 'none');
  };

  const dictionaries = dictionaryRegistry.listDictionaries();
  
  // Recommend keys based on Template Context
  const isMLB = currentTemplate?.metadata.tags.some(t => t.toLowerCase().includes('mlb'));
  
  const recommendedKeys = useMemo(() => {
    if (isMLB) {
      return [
        MLB_KEYS.SCORE_HOME,
        MLB_KEYS.SCORE_AWAY,
        MLB_KEYS.GAME_CLOCK,
        MLB_KEYS.INNING_NUMBER,
        MLB_KEYS.COUNT_OUTS,
        MLB_KEYS.GAME_STATUS
      ];
    }
    return [];
  }, [isMLB]);

  const suggestedItems = useMemo(() => {
    return recommendedKeys.map(id => dictionaryRegistry.getKey(id)).filter(Boolean);
  }, [recommendedKeys]);

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300 px-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-900 bg-zinc-900/20 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-100 uppercase tracking-widest leading-none">Data Integration</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mt-1.5">Step {step} of 3 • {step === 1 ? 'Target Confirmation' : step === 2 ? 'Key Selection' : 'Format Configuration'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-zinc-900 text-zinc-600 hover:text-white transition-all">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Selection Area */}
          <div className="flex-1 p-8 border-r border-zinc-900 overflow-y-auto bg-[radial-gradient(circle_at_top_left,_#0a0a0a_0%,_transparent_100%)]">
            
            {step === 1 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="space-y-2">
                  <h4 className="text-lg font-black text-white uppercase tracking-widest">Verify Target Field</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">You are about to bind a live data stream to the visual property of this layer. Ensure this is the intended target.</p>
                </div>
                
                <div className="p-10 bg-black rounded-[2rem] border border-zinc-800 shadow-inner flex flex-col items-center gap-5 text-center">
                   <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                     <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18.1H3"/></svg>
                   </div>
                   <div>
                     <span className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em] block mb-1">Layer Component</span>
                     <span className="text-2xl font-black text-white uppercase tracking-tighter">{targetLabel}</span>
                   </div>
                   <div className="flex items-center gap-3 px-4 py-1.5 bg-zinc-900 rounded-full border border-zinc-800">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Property:</span>
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Text Value</span>
                   </div>
                </div>

                <Button variant="primary" size="lg" className="w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-blue-600/20" onClick={() => setStep(2)}>
                  Correct • Open Registry
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Step 2: Select Live Key</h4>
                  <button onClick={() => setStep(1)} className="text-[10px] font-bold text-blue-400 hover:underline uppercase tracking-widest">Change Target</button>
                </div>

                {/* ITEM 41: Top Suggestions Section */}
                {suggestedItems.length > 0 && !searchQueryPresent && (
                  <section className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Suggested for Scorebug</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {suggestedItems.map(item => item && (
                        <button
                          key={item.key.keyId}
                          onClick={() => {
                            setSelectedKeyId(item.key.keyId);
                            setStep(3);
                          }}
                          className={`p-4 rounded-2xl border text-left transition-all hover:bg-blue-600/10 hover:border-blue-500/50 group bg-black/40 border-zinc-800 flex flex-col justify-between h-24`}
                        >
                           <div className="flex justify-between items-start">
                             <span className="text-[11px] font-black text-zinc-100 uppercase tracking-tight">{item.key.alias}</span>
                             <span className="text-[7px] bg-blue-900/40 text-blue-500 px-1 rounded uppercase font-black">Top Pick</span>
                           </div>
                           <div className="flex items-center justify-between mt-auto">
                              <span className="text-[9px] text-zinc-600 font-mono truncate">{item.key.canonicalPath}</span>
                              <div 
                                onClick={(e) => { e.stopPropagation(); handleQuickBind(item.key.keyId); }}
                                className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-400 opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-lg"
                                title="Quick Connect"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="m13 2-2 10h7L11 22l2-10H6L13 2z"/></svg>
                              </div>
                           </div>
                        </button>
                      ))}
                    </div>
                    <div className="h-px bg-zinc-900 mx-1"></div>
                  </section>
                )}

                <KeyPicker 
                  dictionaries={dictionaries}
                  selectedKeyId={selectedKeyId}
                  recommendedKeyIds={recommendedKeys}
                  onSelect={(id) => {
                    setSelectedKeyId(id);
                    if (id) setStep(3);
                  }}
                  onQuickBind={handleQuickBind}
                  // FIX: Handle search state propagation to filter suggestions
                  onSearchChange={setSearchQuery}
                  className="h-[380px]"
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Step 3: Final Configuration</h4>
                  <button onClick={() => setStep(2)} className="text-[10px] font-bold text-blue-400 hover:underline uppercase tracking-widest">Change Key</button>
                </div>

                <section className="space-y-6">
                  <div className="p-8 bg-blue-600/10 rounded-[2.5rem] border border-blue-500/20 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-blue-600/20">1</div>
                      <div>
                        <span className="text-xs font-black text-zinc-100 uppercase tracking-widest block">Format Transformer</span>
                        <span className="text-[9px] text-zinc-500 uppercase font-bold">Normalize values for the design stage</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 relative z-10">
                      {[
                        { id: 'none', label: 'Raw Output', desc: 'Preserve exact signal' },
                        { id: 'upper', label: 'UPPERCASE', desc: 'Professional snaking' },
                        { id: 'fixed(0)', label: 'Round to Int', desc: 'No decimal places' },
                        { id: 'fixed(1)', label: 'Precision 1x', desc: 'Single decimal point' }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setTransform(t.id)}
                          className={`flex flex-col p-5 rounded-2xl border text-left transition-all ${transform === t.id ? 'bg-blue-600 border-blue-500 shadow-xl shadow-blue-600/30 ring-4 ring-white/10 scale-[1.02]' : 'bg-black/40 border-zinc-800 hover:border-zinc-700'}`}
                        >
                          <span className={`text-[11px] font-black uppercase tracking-widest ${transform === t.id ? 'text-white' : 'text-zinc-300'}`}>{t.label}</span>
                          <span className={`text-[9px] font-bold mt-1.5 ${transform === t.id ? 'text-blue-100' : 'text-zinc-600'}`}>{t.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>

          {/* Real-time Preview Sidebar */}
          <div className="w-80 bg-zinc-950 p-8 flex flex-col gap-6 shrink-0 border-l border-zinc-900">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Connectivity Proof</h4>
            
            <div className="flex-1 flex flex-col gap-6">
              <div className="space-y-4">
                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest block px-1">Stage Reflection</span>
                <div className="bg-black rounded-[2.5rem] p-10 border-2 border-zinc-900 relative group overflow-hidden shadow-2xl transition-all hover:border-blue-500/30">
                   <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500/10 group-hover:bg-blue-500/60 transition-all duration-700"></div>
                   <div className="text-5xl font-mono font-black text-blue-400 break-all leading-none tracking-tighter drop-shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                     {displayValue}
                   </div>
                   <div className="flex items-center gap-2 mt-8">
                     <div className={`w-2 h-2 rounded-full ${record ? 'bg-green-500 animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 'bg-zinc-800'}`}></div>
                     <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                       {record ? 'Active Bus Signal' : 'Awaiting Heartbeat'}
                     </span>
                   </div>
                </div>
              </div>

              {lookup && (
                <div className="p-6 bg-zinc-900/40 rounded-[2rem] border border-zinc-800/50 space-y-5 animate-in fade-in slide-in-from-bottom-2">
                   <div className="flex flex-col gap-1.5">
                     <span className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">Signal Alias</span>
                     <span className="text-sm font-black text-zinc-100 uppercase tracking-tight">{lookup.key.alias}</span>
                   </div>
                   <div className="flex flex-col gap-1.5">
                     <span className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">Platform Path</span>
                     <span className="text-[10px] text-blue-400 font-mono break-all bg-black/40 p-2.5 rounded-xl border border-blue-500/10">{lookup.key.canonicalPath}</span>
                   </div>
                   <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                      <span className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">Bus Scope</span>
                      <span className="text-[9px] font-black text-zinc-400 uppercase bg-zinc-800 px-2 py-0.5 rounded tracking-widest">{lookup.key.scope}</span>
                   </div>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-6 border-t border-zinc-900">
               <Button 
                variant="primary" 
                size="lg" 
                disabled={step !== 3 || !selectedKeyId}
                onClick={handleConfirm}
                className={`w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_15px_40px_rgba(0,0,0,0.5)] transition-all ${step === 3 ? 'bg-blue-600 shadow-blue-600/30 hover:scale-[1.02] active:scale-95' : 'bg-zinc-900 text-zinc-700 grayscale'}`}
               >
                 Confirm & Apply
               </Button>
               <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="w-full text-zinc-600 font-black uppercase tracking-widest text-[9px] hover:text-zinc-300"
               >
                 Cancel Integration
               </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


import React, { useState, useMemo, useEffect } from 'react';
import { useLiveValue } from '../../../shared/data-runtime/hooks';
import { dictionaryRegistry } from '../../../shared/data-runtime/DictionaryRegistry';
import { KeyPicker } from '../../../shared/components/KeyPicker';
import { Button } from '../../../shared/components/Button';
import { applyTransforms } from '../../../contract/transforms';
import { useDataStore } from '../../data-engine/store/useDataStore';
import { MLB_KEYS } from '../../../contract/dictionaries/mlb';

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

  const { simController } = useDataStore();

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedKeyId(initialKeyId);
      setTransform(initialTransform);
      setStep(1);
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
    onConfirm(selectedKeyId, transform);
  };

  const dictionaries = dictionaryRegistry.listDictionaries();
  
  // Recommend MLB keys if in MLB mode
  const recommendedKeys = simController.mode === 'demoPipeline' ? [
    MLB_KEYS.SCORE_HOME,
    MLB_KEYS.SCORE_AWAY,
    MLB_KEYS.GAME_CLOCK,
    MLB_KEYS.INNING_NUMBER,
    MLB_KEYS.COUNT_OUTS,
    MLB_KEYS.GAME_STATUS
  ] : [];

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300 px-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
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
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mt-1.5">Step {step} of 3 • Wire Live Assets</p>
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
                
                <div className="p-8 bg-black rounded-[2rem] border border-zinc-800 shadow-inner flex flex-col items-center gap-4 text-center">
                   <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18.1H3"/></svg>
                   </div>
                   <div>
                     <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] block mb-1">Layer Component</span>
                     <span className="text-xl font-black text-white uppercase tracking-tighter">{targetLabel}</span>
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Property:</span>
                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Text Content</span>
                   </div>
                </div>

                <Button variant="primary" size="lg" className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-600/10" onClick={() => setStep(2)}>
                  Correct • Proceed to Registry
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Step 2: Select Live Key</h4>
                  <button onClick={() => setStep(1)} className="text-[10px] font-bold text-blue-400 hover:underline uppercase tracking-widest">Change Target</button>
                </div>
                <KeyPicker 
                  dictionaries={dictionaries}
                  selectedKeyId={selectedKeyId}
                  recommendedKeyIds={recommendedKeys}
                  onSelect={(id) => {
                    setSelectedKeyId(id);
                    if (id) setStep(3);
                  }}
                  className="h-[400px]"
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
                  <div className="p-6 bg-blue-600/10 rounded-[2rem] border border-blue-500/20 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-black">1</div>
                      <span className="text-xs font-black text-zinc-100 uppercase tracking-widest">Format Transformer</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 relative z-10">
                      {[
                        { id: 'none', label: 'Raw Output', desc: 'Preserve exact signal' },
                        { id: 'upper', label: 'UPPERCASE', desc: 'Professional snaking' },
                        { id: 'pct', label: 'Percentage', desc: 'Multiply by 100%' },
                        { id: 'fixed(0)', label: 'Round to Int', desc: 'No decimal places' },
                        { id: 'fixed(1)', label: 'Precision 1x', desc: 'Single decimal point' },
                        { id: 'fixed(2)', label: 'Precision 2x', desc: 'Two decimal points' }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setTransform(t.id)}
                          className={`flex flex-col p-4 rounded-2xl border text-left transition-all ${transform === t.id ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/30 ring-2 ring-white/10' : 'bg-black/40 border-zinc-800 hover:border-zinc-700'}`}
                        >
                          <span className={`text-[10px] font-black uppercase tracking-widest ${transform === t.id ? 'text-white' : 'text-zinc-300'}`}>{t.label}</span>
                          <span className={`text-[8px] font-bold mt-1 ${transform === t.id ? 'text-blue-100' : 'text-zinc-600'}`}>{t.desc}</span>
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
              <div className="space-y-3">
                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest block px-1">Stage Reflection</span>
                <div className="bg-black rounded-[2.5rem] p-8 border-2 border-zinc-900 relative group overflow-hidden shadow-2xl">
                   <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500/10 group-hover:bg-blue-500/60 transition-all duration-700"></div>
                   <div className="text-4xl font-mono font-black text-blue-400 break-all leading-none tracking-tighter drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                     {displayValue}
                   </div>
                   <div className="flex items-center gap-2 mt-6">
                     <div className={`w-2 h-2 rounded-full ${record ? 'bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-zinc-800'}`}></div>
                     <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                       {record ? 'Active Bus Signal' : 'Awaiting Heartbeat'}
                     </span>
                   </div>
                </div>
              </div>

              {lookup && (
                <div className="p-5 bg-zinc-900/40 rounded-3xl border border-zinc-800/50 space-y-4">
                   <div className="flex flex-col gap-1.5">
                     <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Signal Alias</span>
                     <span className="text-xs font-black text-zinc-100 uppercase tracking-tight">{lookup.key.alias}</span>
                   </div>
                   <div className="flex flex-col gap-1.5">
                     <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Platform Path</span>
                     <span className="text-[10px] text-zinc-400 font-mono break-all bg-black/40 p-2 rounded-lg border border-zinc-800/50">{lookup.key.canonicalPath}</span>
                   </div>
                   <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                      <span className="text-[8px] text-zinc-600 uppercase font-black">Type</span>
                      <span className="text-[9px] font-black text-zinc-400 uppercase bg-zinc-800 px-1.5 py-0.5 rounded">{lookup.key.valueType}</span>
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
                className={`w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl transition-all ${step === 3 ? 'bg-blue-600 shadow-blue-600/20 active:scale-95' : 'bg-zinc-900 text-zinc-700 grayscale'}`}
               >
                 Confirm & Publish
               </Button>
               <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="w-full text-zinc-600 font-black uppercase tracking-widest text-[9px] hover:text-white"
               >
                 Abort Integration
               </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

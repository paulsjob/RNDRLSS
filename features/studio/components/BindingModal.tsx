
import React, { useState, useMemo, useEffect } from 'react';
import { useLiveValue } from '../../../shared/data-runtime/hooks';
import { dictionaryRegistry } from '../../../shared/data-runtime/DictionaryRegistry';
import { KeyPicker } from '../../../shared/components/KeyPicker';
import { Button } from '../../../shared/components/Button';
import { applyTransforms } from '../../../contract/transforms';
import { Dictionary } from '../../../contract/types';

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
  const [step, setStep] = useState<1 | 2>(1);

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

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-300 px-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-900 bg-zinc-900/20 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-100 uppercase tracking-widest">Connect Live Data</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Target:</span>
                <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/20">{targetLabel}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-zinc-900 text-zinc-600 hover:text-white transition-all">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Selection Area */}
          <div className="flex-1 p-6 border-r border-zinc-900 overflow-y-auto">
            {step === 1 ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Step 1: Select Key</h4>
                  <span className="text-[9px] text-zinc-700 font-bold italic">Search across {dictionaries.length} dictionaries</span>
                </div>
                <KeyPicker 
                  dictionaries={dictionaries}
                  selectedKeyId={selectedKeyId}
                  onSelect={(id) => {
                    setSelectedKeyId(id);
                    if (id) setStep(2);
                  }}
                  className="h-full"
                />
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between px-1">
                  <button onClick={() => setStep(1)} className="flex items-center gap-2 text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    Back to Selection
                  </button>
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Step 2: Configure</h4>
                </div>

                <section className="space-y-4">
                  <div className="p-5 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-black">1</div>
                      <span className="text-xs font-black text-zinc-100 uppercase tracking-widest">Transform Logic</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'none', label: 'Raw Output', desc: 'No changes' },
                        { id: 'upper', label: 'UPPERCASE', desc: 'SCREAMING_SNAKE' },
                        { id: 'pct', label: 'Percentage', desc: '0.1 -> 10%' },
                        { id: 'fixed(0)', label: 'Integer', desc: 'Round to whole' },
                        { id: 'fixed(2)', label: 'Decimals', desc: 'Two decimal pts' }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setTransform(t.id)}
                          className={`flex flex-col p-3 rounded-xl border text-left transition-all ${transform === t.id ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-600/20' : 'bg-black/40 border-zinc-800 hover:border-zinc-700'}`}
                        >
                          <span className={`text-[10px] font-black uppercase tracking-widest ${transform === t.id ? 'text-white' : 'text-zinc-300'}`}>{t.label}</span>
                          <span className={`text-[8px] font-bold mt-1 ${transform === t.id ? 'text-blue-100' : 'text-zinc-600'}`}>{t.desc}</span>
                        </button>
                      ))}
                    </div>
                  </section>
              </div>
            )}
          </div>

          {/* Real-time Preview Sidebar */}
          <div className="w-72 bg-zinc-950 p-6 flex flex-col gap-6 shrink-0 border-l border-zinc-900">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Confidence Preview</h4>
            
            <div className="flex-1 flex flex-col gap-6">
              <div className="space-y-3">
                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest block">Live Stream</span>
                <div className="bg-black rounded-2xl p-6 border-2 border-zinc-900 relative group overflow-hidden shadow-inner">
                   <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/10 group-hover:bg-blue-500/40 transition-colors"></div>
                   <div className="text-3xl font-mono font-black text-blue-400 break-all leading-none tracking-tighter">
                     {displayValue}
                   </div>
                   <div className="flex items-center gap-2 mt-4">
                     <div className={`w-1.5 h-1.5 rounded-full ${record ? 'bg-green-500 animate-pulse' : 'bg-zinc-800'}`}></div>
                     <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
                       {record ? 'Real-time Signal' : 'Awaiting Data...'}
                     </span>
                   </div>
                </div>
              </div>

              {lookup && (
                <div className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800/50 space-y-3">
                   <div className="flex flex-col gap-1">
                     <span className="text-[8px] text-zinc-600 uppercase font-black">Provider Path</span>
                     <span className="text-[10px] text-zinc-400 font-mono break-all">{lookup.key.canonicalPath}</span>
                   </div>
                   <div className="flex flex-col gap-1">
                     <span className="text-[8px] text-zinc-600 uppercase font-black">Value Type</span>
                     <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{lookup.key.valueType}</span>
                   </div>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-6 border-t border-zinc-900">
               <Button 
                variant="primary" 
                size="lg" 
                disabled={!selectedKeyId}
                onClick={handleConfirm}
                className="w-full h-12 font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-blue-600/10 active:scale-95 transition-all"
               >
                 Confirm Binding
               </Button>
               <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="w-full text-zinc-600 font-bold uppercase tracking-widest text-[9px]"
               >
                 Cancel
               </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { liveBus } from '../../../shared/data-runtime';
import { dictionaryRegistry } from '../../../shared/data-runtime/DictionaryRegistry';
import { DeltaMessageSchema, EventMessageSchema } from '../../../contract/schemas';
import { KeyPicker } from '../../../shared/components/KeyPicker';
import { Button } from '../../../shared/components/Button';
import { useDataStore } from '../store/useDataStore';

export const BindingTestConsole: React.FC = () => {
  const { orgId, setOrgId } = useDataStore();
  
  const [availableDicts, setAvailableDicts] = useState(dictionaryRegistry.listDictionaries());

  useEffect(() => {
    dictionaryRegistry.setOrgId(orgId);
    setAvailableDicts(dictionaryRegistry.listDictionaries());
    
    const unsub = dictionaryRegistry.subscribe(() => {
      setAvailableDicts(dictionaryRegistry.listDictionaries());
    });
    return unsub;
  }, [orgId]);

  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [type, setType] = useState<"delta" | "event">("delta");
  const [status, setStatus] = useState<{ msg: string; color: string } | null>(null);

  const handlePublish = () => {
    if (!selectedKeyId) {
      setStatus({ msg: "Select a key first", color: "text-red-400" });
      return;
    }

    const lookup = dictionaryRegistry.getKey(selectedKeyId);
    if (!lookup) {
      setStatus({ msg: "Key not found in current org scope", color: "text-red-400" });
      return;
    }

    const { dictionary, key } = lookup;

    try {
      // 1. Basic JSON parse
      let parsedValue;
      try {
        parsedValue = JSON.parse(value || 'null');
      } catch (e) {
        // If it's not valid JSON, treat it as a raw string for convenience
        parsedValue = value;
      }
      
      // 2. Value Type Validation (Simple check)
      if (key.valueType === 'number' && isNaN(Number(parsedValue))) {
        throw new Error(`Value must be a number for key ${key.alias}`);
      }
      if (key.valueType === 'boolean' && typeof parsedValue !== 'boolean' && parsedValue !== 'true' && parsedValue !== 'false') {
         throw new Error(`Value must be a boolean for key ${key.alias}`);
      }

      const basePayload = {
        dictionaryId: dictionary.dictionaryId,
        dictionaryVersion: dictionary.version,
        sourceId: `console_${orgId}`,
        seq: Date.now(),
        ts: Date.now(),
      };

      if (type === "delta") {
        const message = {
          ...basePayload,
          type: 'delta' as const,
          changes: [{ keyId: selectedKeyId, value: parsedValue }]
        };
        DeltaMessageSchema.parse(message);
        liveBus.publish(message);
      } else {
        const message = {
          ...basePayload,
          type: 'event' as const,
          eventKeyId: selectedKeyId,
          value: parsedValue,
          payload: { source: 'binding_test_console', orgId }
        };
        EventMessageSchema.parse(message);
        liveBus.publish(message);
      }

      setStatus({ msg: `Published to ${dictionary.dictionaryId.split('.').slice(-1)[0]}`, color: "text-green-400" });
      setTimeout(() => setStatus(null), 2500);
    } catch (e: any) {
      console.error('[BindingTestConsole] Publish Error', e);
      setStatus({ 
        msg: e.message || "Protocol Violation", 
        color: "text-red-500" 
      });
    }
  };

  return (
    <div className="p-5 bg-zinc-900/90 border-t border-zinc-800 space-y-4 shadow-2xl backdrop-blur-xl relative z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)] animate-pulse"></div>
            <h4 className="text-[11px] font-black text-zinc-100 uppercase tracking-widest">Bus Interaction Console</h4>
          </div>
          <div className="h-4 w-px bg-zinc-800"></div>
          <span className="text-[9px] font-mono text-zinc-600 font-bold uppercase tracking-widest">Protocol: Renderless Live V1</span>
        </div>
        {status && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-zinc-800 animate-in fade-in slide-in-from-right-2 duration-300`}>
            <span className={`text-[9px] font-black uppercase tracking-widest ${status.color}`}>
              {status.msg}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-5 space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">1. Organization Context</label>
              <span className="text-[8px] text-zinc-700 font-mono">Scope Isolation</span>
            </div>
            <select 
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-blue-400 font-black focus:border-blue-500 outline-none cursor-pointer hover:bg-zinc-950 transition-colors"
            >
              <option value="org_default">Global Default</option>
              <option value="org_test">Test Sandbox</option>
              <option value="org_seahawks">Seattle Seahawks</option>
              <option value="org_niners">SF 49ers</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">2. Target Destination (Key)</label>
            <KeyPicker 
              dictionaries={availableDicts}
              selectedKeyId={selectedKeyId}
              onSelect={setSelectedKeyId}
              className="bg-black/20 rounded-xl p-1"
            />
          </div>
        </div>

        <div className="col-span-7 space-y-5 flex flex-col">
          <div className="space-y-2">
            <label className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">3. Protocol Method</label>
            <div className="flex gap-2 bg-black/50 p-1 rounded-xl border border-zinc-800">
              <button 
                onClick={() => setType("delta")}
                className={`flex-1 px-4 py-2 text-[10px] font-black rounded-lg uppercase transition-all flex items-center justify-center gap-2 ${type === "delta" ? 'bg-zinc-800 text-blue-400 border border-zinc-700 shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${type === "delta" ? 'bg-blue-500' : 'bg-zinc-700'}`}></div>
                Delta (State)
              </button>
              <button 
                onClick={() => setType("event")}
                className={`flex-1 px-4 py-2 text-[10px] font-black rounded-lg uppercase transition-all flex items-center justify-center gap-2 ${type === "event" ? 'bg-zinc-800 text-amber-500 border border-zinc-700 shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${type === "event" ? 'bg-amber-500' : 'bg-zinc-700'}`}></div>
                Event (Signal)
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">4. Wire Payload</label>
              <span className="text-[8px] text-zinc-700 font-mono italic">Strict JSON or Raw Value</span>
            </div>
            <textarea 
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='e.g. 10 or "LIVE" or {"x": 1, "y": 2}'
              className="flex-1 w-full bg-black border border-zinc-800 rounded-xl p-4 text-[12px] font-mono text-blue-100 focus:border-blue-500 outline-none resize-none shadow-inner placeholder:text-zinc-800"
            />
          </div>

          <Button 
            size="lg" 
            variant="primary" 
            onClick={handlePublish}
            disabled={!selectedKeyId}
            className="w-full font-black uppercase tracking-[0.2em] text-[11px] h-12 shadow-xl shadow-blue-600/10 active:scale-[0.98] transition-all"
          >
            Commit to Bus Alpha
          </Button>
        </div>
      </div>
    </div>
  );
};

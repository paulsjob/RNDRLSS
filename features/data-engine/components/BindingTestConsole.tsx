
import React, { useState, useEffect, useMemo } from 'react';
import { liveBus } from '../../../shared/data-runtime';
import { dictionaryRegistry } from '../../../shared/data-runtime/DictionaryRegistry';
import { DeltaMessageSchema, EventMessageSchema } from '../../../contract/schemas';
import { KeyPicker } from '../../../shared/components/KeyPicker';
import { Button } from '../../../shared/components/Button';
import { useDataStore } from '../store/useDataStore';

export const BindingTestConsole: React.FC = () => {
  const { orgId, setOrgId } = useDataStore();
  
  // Local state for available dictionaries based on current registry org
  const [availableDicts, setAvailableDicts] = useState(dictionaryRegistry.listDictionaries());

  useEffect(() => {
    // Sync registry org with store org
    dictionaryRegistry.setOrgId(orgId);
    setAvailableDicts(dictionaryRegistry.listDictionaries());
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
      setStatus({ msg: "Key not found in registry", color: "text-red-400" });
      return;
    }

    const { dictionary } = lookup;

    try {
      const parsedValue = JSON.parse(value || 'null');
      
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
          payload: { source: 'binding_test_console' }
        };
        EventMessageSchema.parse(message);
        liveBus.publish(message);
      }

      setStatus({ msg: `Published to ${dictionary.dictionaryId.split('.').slice(-1)}`, color: "text-green-400" });
      setTimeout(() => setStatus(null), 2500);
    } catch (e: any) {
      setStatus({ msg: e.name === 'ZodError' ? "Schema Violation" : "Malformed JSON", color: "text-red-400" });
    }
  };

  return (
    <div className="p-4 bg-zinc-900/90 border-t border-zinc-800 space-y-4 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
          <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Global Binding Test Console</h4>
        </div>
        {status && (
          <span className={`text-[9px] font-black uppercase animate-pulse ${status.color}`}>
            {status.msg}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">1. Domain Context (Org)</label>
            <select 
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-xs text-blue-400 font-bold focus:border-blue-500 outline-none cursor-pointer"
            >
              <option value="org_default">Global Default</option>
              <option value="org_test">Test Environment</option>
            </select>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">2. Search Dictionary Registry</label>
            <KeyPicker 
              dictionaries={availableDicts}
              selectedKeyId={selectedKeyId}
              onSelect={setSelectedKeyId}
            />
          </div>
        </div>

        <div className="space-y-4 flex flex-col">
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">3. Protocol Mode</label>
            <div className="flex gap-1 bg-black p-1 rounded-lg border border-zinc-800">
              <button 
                onClick={() => setType("delta")}
                className={`flex-1 px-3 py-1.5 text-[9px] font-black rounded-md uppercase transition-all ${type === "delta" ? 'bg-zinc-800 text-blue-400 border border-zinc-700' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                Delta (State)
              </button>
              <button 
                onClick={() => setType("event")}
                className={`flex-1 px-3 py-1.5 text-[9px] font-black rounded-md uppercase transition-all ${type === "event" ? 'bg-zinc-800 text-amber-500 border border-zinc-700' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                Event (Signal)
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-[9px] text-zinc-600 uppercase font-black tracking-widest">4. JSON Payload</label>
            <textarea 
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='e.g. 10 or "LIVE" or {"x": 1}'
              className="flex-1 w-full bg-black border border-zinc-800 rounded-lg p-3 text-[11px] font-mono text-zinc-200 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          <Button 
            size="md" 
            variant="primary" 
            onClick={handlePublish}
            disabled={!selectedKeyId}
            className="w-full font-black uppercase tracking-widest text-[10px] h-10 shadow-lg shadow-blue-500/10"
          >
            Publish to Org Bus
          </Button>
        </div>
      </div>
    </div>
  );
};

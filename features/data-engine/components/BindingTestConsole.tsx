
import React, { useState, useEffect, useMemo } from 'react';
import { liveBus } from '../../../shared/data-runtime';
import { dictionaryRegistry } from '../../../shared/data-runtime/DictionaryRegistry';
import { DeltaMessageSchema, EventMessageSchema } from '../../../contract/schemas';
import { KeyPicker } from '../../../shared/components/KeyPicker';
import { Button } from '../../../shared/components/Button';
import { useDataStore } from '../store/useDataStore';
import { MLB_KEYS } from '../../../contract/dictionaries/mlb';

interface ConsoleLogEntry {
  id: string;
  ts: number;
  keyAlias: string;
  type: 'delta' | 'event';
  value: string;
}

export const BindingTestConsole: React.FC = () => {
  const { orgId, setOrgId } = useDataStore();
  
  const [availableDicts, setAvailableDicts] = useState(dictionaryRegistry.listDictionaries());
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [type, setType] = useState<"delta" | "event">("delta");
  const [status, setStatus] = useState<{ msg: string; color: string } | null>(null);
  const [log, setLog] = useState<ConsoleLogEntry[]>([]);

  useEffect(() => {
    dictionaryRegistry.setOrgId(orgId);
    setAvailableDicts(dictionaryRegistry.listDictionaries());
    
    const unsub = dictionaryRegistry.subscribe(() => {
      setAvailableDicts(dictionaryRegistry.listDictionaries());
    });
    return unsub;
  }, [orgId]);

  // Validation Logic
  const validation = useMemo(() => {
    if (!selectedKeyId) return { valid: false, error: "Target key required" };
    
    const lookup = dictionaryRegistry.getKey(selectedKeyId);
    if (!lookup) return { valid: false, error: "Key not found in registry" };

    try {
      if (value.trim() === "") return { valid: false, error: "Payload cannot be empty" };
      JSON.parse(value);
    } catch (e) {
      // If it's not JSON, it's only valid if the key type is string/number and we can coerce it
      if (lookup.key.valueType === 'object' || lookup.key.valueType === 'array') {
        return { valid: false, error: "Key requires structured JSON payload" };
      }
    }

    return { valid: true, error: null };
  }, [selectedKeyId, value]);

  const handlePreset = (presetId: string) => {
    let targetKey = "";
    let payload: any = "";
    let targetType: "delta" | "event" = "delta";

    switch(presetId) {
      case 'LIVE':
        targetKey = MLB_KEYS.GAME_STATUS;
        payload = "LIVE";
        break;
      case 'SCORE':
        targetKey = MLB_KEYS.SCORE_HOME;
        const currentScore = liveBus.getValue(MLB_KEYS.SCORE_HOME)?.value || 0;
        payload = Number(currentScore) + 1;
        break;
      case 'BASES':
        targetKey = MLB_KEYS.BASES_FIRST;
        payload = !liveBus.getValue(MLB_KEYS.BASES_FIRST)?.value;
        break;
      case 'INNING':
        targetKey = MLB_KEYS.INNING_NUMBER;
        const currentInning = liveBus.getValue(MLB_KEYS.INNING_NUMBER)?.value || 1;
        payload = Number(currentInning) + 1;
        break;
      case 'HIT_EVENT':
        targetKey = MLB_KEYS.GAME_EVENTS;
        targetType = "event";
        payload = { event: "HIT", timestamp: new Date().toISOString() };
        break;
      case 'OUT_EVENT':
        targetKey = MLB_KEYS.GAME_EVENTS;
        targetType = "event";
        payload = { event: "OUT", result: "Strikeout" };
        break;
    }

    setSelectedKeyId(targetKey);
    setType(targetType);
    setValue(typeof payload === 'string' ? `"${payload}"` : JSON.stringify(payload, null, 2));
    setStatus({ msg: `Preset Loaded: ${presetId}`, color: "text-blue-400" });
    setTimeout(() => setStatus(null), 2000);
  };

  const handlePublish = () => {
    if (!validation.valid || !selectedKeyId) return;

    const lookup = dictionaryRegistry.getKey(selectedKeyId);
    if (!lookup) return;

    const { dictionary } = lookup;

    try {
      let parsedValue;
      try {
        parsedValue = JSON.parse(value);
      } catch (e) {
        parsedValue = value;
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

      // Update log
      setLog(prev => [{
        id: Math.random().toString(36).substr(2, 9),
        ts: Date.now(),
        keyAlias: lookup.key.alias,
        type: type,
        value: value.length > 20 ? value.substring(0, 17) + "..." : value
      }, ...prev].slice(0, 10));

      setStatus({ msg: "Transmission Successful", color: "text-green-400" });
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
    <div className="p-5 bg-zinc-900/90 border-t border-zinc-800 space-y-4 shadow-2xl backdrop-blur-xl relative z-10 overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.6)] animate-pulse"></div>
            <h4 className="text-[11px] font-black text-zinc-100 uppercase tracking-widest">Bus Interaction Console</h4>
          </div>
          <div className="h-4 w-px bg-zinc-800"></div>
          <span className="text-[9px] font-mono text-zinc-600 font-bold uppercase tracking-widest">Operator Tier V1</span>
        </div>
        {status && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-zinc-800 animate-in fade-in slide-in-from-right-2 duration-300`}>
            <span className={`text-[9px] font-black uppercase tracking-widest ${status.color}`}>
              {status.msg}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Column 1: Config */}
        <div className="col-span-3 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] text-zinc-500 uppercase font-black tracking-widest ml-1">Org Scope</label>
            <select 
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-blue-400 font-black outline-none cursor-pointer"
            >
              <option value="org_default">Global Default</option>
              <option value="org_seahawks">Seattle Seahawks</option>
              <option value="org_niners">SF 49ers</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] text-zinc-500 uppercase font-black tracking-widest ml-1">Quick Presets</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'LIVE', label: 'Set Live', icon: '📡' },
                { id: 'SCORE', label: 'Score +1', icon: '⚾' },
                { id: 'BASES', label: 'Toggle 1B', icon: '🏃' },
                { id: 'INNING', label: 'Next Inn', icon: '🔢' },
                { id: 'HIT_EVENT', label: 'Emit HIT', icon: '⚡' },
                { id: 'OUT_EVENT', label: 'Emit OUT', icon: '🛑' },
              ].map(p => (
                <button 
                  key={p.id}
                  onClick={() => handlePreset(p.id)}
                  className="flex flex-col items-center justify-center p-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl hover:bg-zinc-800 hover:border-blue-500/30 transition-all group"
                >
                  <span className="text-sm mb-1">{p.icon}</span>
                  <span className="text-[8px] font-black uppercase text-zinc-400 group-hover:text-blue-400">{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Key & Payload */}
        <div className="col-span-6 space-y-4 flex flex-col">
          <div className="flex-1 space-y-4 flex flex-col">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5 flex flex-col">
                 <label className="text-[9px] text-zinc-500 uppercase font-black tracking-widest ml-1">Target Key</label>
                 <KeyPicker 
                    dictionaries={availableDicts}
                    selectedKeyId={selectedKeyId}
                    onSelect={setSelectedKeyId}
                    className="flex-1 bg-black/40 rounded-xl p-1 border border-zinc-800/50"
                  />
               </div>
               <div className="space-y-4 flex flex-col">
                 <div className="space-y-1.5 flex flex-col flex-1">
                   <label className="text-[9px] text-zinc-500 uppercase font-black tracking-widest ml-1">Payload Editor</label>
                   <div className={`flex-1 relative flex flex-col rounded-xl border transition-all ${validation.error ? 'border-red-500/50 bg-red-500/5' : 'border-zinc-800 bg-black'}`}>
                      <textarea 
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder='e.g. 10 or {"event": "HIT"}'
                        className="flex-1 w-full bg-transparent p-3 text-[11px] font-mono text-blue-100 outline-none resize-none placeholder:text-zinc-800"
                      />
                      {validation.error && (
                        <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                           <div className="w-1 h-1 rounded-full bg-red-500"></div>
                           <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter">{validation.error}</span>
                        </div>
                      )}
                   </div>
                 </div>

                 <div className="flex gap-2 p-1 bg-black rounded-lg border border-zinc-800">
                    <button onClick={() => setType("delta")} className={`flex-1 py-1.5 text-[9px] font-black rounded uppercase transition-all ${type === 'delta' ? 'bg-zinc-800 text-blue-400' : 'text-zinc-600'}`}>Delta</button>
                    <button onClick={() => setType("event")} className={`flex-1 py-1.5 text-[9px] font-black rounded uppercase transition-all ${type === 'event' ? 'bg-zinc-800 text-amber-500' : 'text-zinc-600'}`}>Event</button>
                 </div>
               </div>
             </div>

             <Button 
                size="lg" 
                variant="primary" 
                onClick={handlePublish}
                disabled={!validation.valid}
                className={`w-full font-black uppercase tracking-[0.2em] text-[11px] h-10 shadow-xl transition-all ${validation.valid ? 'bg-blue-600 shadow-blue-600/20' : 'bg-zinc-800 text-zinc-600 grayscale opacity-50 cursor-not-allowed'}`}
              >
                Transmit to Alpha Bus
              </Button>
          </div>
        </div>

        {/* Column 3: History */}
        <div className="col-span-3 space-y-2">
          <label className="text-[9px] text-zinc-500 uppercase font-black tracking-widest ml-1">Recent Activity</label>
          <div className="h-[180px] bg-black/40 rounded-2xl border border-zinc-800/50 flex flex-col overflow-hidden">
             {log.length > 0 ? (
               <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
                  {log.map(entry => (
                    <div key={entry.id} className="p-2 bg-zinc-900/60 border border-zinc-800/40 rounded-lg flex items-center justify-between group animate-in slide-in-from-left-2 duration-300">
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        <span className="text-[9px] font-black text-zinc-300 truncate">{entry.keyAlias}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[7px] font-black uppercase px-1 rounded-sm border ${entry.type === 'delta' ? 'border-blue-900 text-blue-500' : 'border-amber-900 text-amber-500'}`}>
                            {entry.type}
                          </span>
                          <span className="text-[8px] font-mono text-zinc-600 truncate">{entry.value}</span>
                        </div>
                      </div>
                      <span className="text-[7px] font-mono text-zinc-700 shrink-0">{new Date(entry.ts).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                  ))}
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-zinc-800 p-4 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-10 mb-2"><path d="M12 20v-6M9 20V10M15 20V4M3 20h18"/></svg>
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-30">Awaiting Signal Transmission</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

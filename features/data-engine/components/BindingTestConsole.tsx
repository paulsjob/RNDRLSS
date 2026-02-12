
import React, { useState } from 'react';
import { liveBus } from '../../../shared/data-runtime';
import { MLB_CANON_DICTIONARY } from '../../../contract/dictionaries/mlb';
import { KeyPicker } from '../../../shared/components/KeyPicker';
import { Button } from '../../../shared/components/Button';

export const BindingTestConsole: React.FC = () => {
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [type, setType] = useState<"delta" | "event">("delta");
  const [status, setStatus] = useState<{ msg: string; color: string } | null>(null);

  const handlePublish = () => {
    if (!selectedKeyId) {
      setStatus({ msg: "Please select a key", color: "text-red-400" });
      return;
    }

    try {
      const parsedValue = JSON.parse(value || '""');
      
      if (type === "delta") {
        liveBus.publish({
          type: 'delta',
          dictionaryId: MLB_CANON_DICTIONARY.dictionaryId,
          dictionaryVersion: MLB_CANON_DICTIONARY.version,
          sourceId: 'dev_console_01',
          seq: Date.now(),
          ts: Date.now(),
          changes: [{ keyId: selectedKeyId, value: parsedValue }]
        });
      } else {
        liveBus.publish({
          type: 'event',
          dictionaryId: MLB_CANON_DICTIONARY.dictionaryId,
          dictionaryVersion: MLB_CANON_DICTIONARY.version,
          sourceId: 'dev_console_01',
          seq: Date.now(),
          ts: Date.now(),
          eventKeyId: selectedKeyId,
          value: parsedValue,
          payload: { source: 'console' }
        });
      }

      setStatus({ msg: "Published successfully", color: "text-green-400" });
      setTimeout(() => setStatus(null), 2000);
    } catch (e) {
      setStatus({ msg: "Invalid JSON value", color: "text-red-400" });
    }
  };

  return (
    <div className="p-4 bg-zinc-900/50 border-t border-zinc-800 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Binding Test Console</h4>
        {status && <span className={`text-[9px] font-bold uppercase ${status.color}`}>{status.msg}</span>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[9px] text-zinc-600 uppercase font-black">1. Select Key</label>
          <KeyPicker 
            dictionary={MLB_CANON_DICTIONARY}
            selectedKeyId={selectedKeyId}
            onSelect={setSelectedKeyId}
          />
        </div>

        <div className="space-y-3 flex flex-col">
          <div className="space-y-1">
            <label className="text-[9px] text-zinc-600 uppercase font-black">2. Message Configuration</label>
            <div className="flex gap-1 bg-black p-1 rounded border border-zinc-800">
              <button 
                onClick={() => setType("delta")}
                className={`flex-1 px-2 py-1 text-[9px] font-bold rounded uppercase transition-all ${type === "delta" ? 'bg-zinc-800 text-blue-400 shadow-sm' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                Delta
              </button>
              <button 
                onClick={() => setType("event")}
                className={`flex-1 px-2 py-1 text-[9px] font-bold rounded uppercase transition-all ${type === "event" ? 'bg-zinc-800 text-amber-400 shadow-sm' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                Event
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[9px] text-zinc-600 uppercase font-black">3. Value (JSON)</label>
            <textarea 
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='"Your Value"'
              className="flex-1 w-full bg-black border border-zinc-800 rounded p-2 text-[10px] font-mono text-blue-400 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          <Button 
            size="sm" 
            variant="primary" 
            onClick={handlePublish}
            disabled={!selectedKeyId}
            className="w-full"
          >
            Publish Update
          </Button>
        </div>
      </div>
    </div>
  );
};

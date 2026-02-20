
import React, { useRef, useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { liveBus } from '../../../shared/data-runtime';
import { SnapshotBundleV1Schema } from '../../../contract/schemas';
import { SnapshotBundleV1, SnapshotMessage } from '../../../contract/types';
import { Button } from '../../../shared/components/Button';

export const SnapshotManager: React.FC = () => {
  const { orgId, setOrgId, importedDictionaries, builtinDictionaries, mappings, nodes, edges, importBundleData } = useDataStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<{ imported: number; skipped: number; conflicts: string[] } | null>(null);

  const captureLiveSnapshot = (): SnapshotMessage | undefined => {
    // Collect all current values from LiveBus for active keys
    const values: Record<string, any> = {};
    const allDicts = [...builtinDictionaries, ...importedDictionaries];
    
    allDicts.forEach(dict => {
      dict.keys.forEach(key => {
        const val = liveBus.getValue(key.keyId);
        if (val) values[key.keyId] = val.value;
      });
    });

    if (Object.keys(values).length === 0) return undefined;

    return {
      type: 'snapshot',
      dictionaryId: 'org.snapshot.bundle',
      dictionaryVersion: '1.0.0',
      sourceId: `bundle_export_${orgId}`,
      seq: Date.now(),
      ts: Date.now(),
      values
    };
  };

  const handleExport = () => {
    try {
      const bundle: SnapshotBundleV1 = {
        bundleVersion: "1.0.0",
        exportedAt: Date.now(),
        orgId: orgId,
        dictionaries: [...builtinDictionaries, ...importedDictionaries],
        mappings: mappings,
        graphs: [{ nodes, edges }],
        sampleSnapshot: captureLiveSnapshot()
      };

      // Validate with Zod
      SnapshotBundleV1Schema.parse(bundle);

      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `renderless_v1_${orgId}_${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setError(null);
      setReport(null);
    } catch (e: any) {
      console.error(e);
      setError(`Export failed: ${e.message}`);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const bundle = SnapshotBundleV1Schema.parse(json);

        if (bundle.orgId !== orgId) {
          if (!confirm(`Warning: This bundle belongs to org "${bundle.orgId}", but you are importing into current org "${orgId}". Conflict resolution will still apply. Proceed?`)) {
            return;
          }
        }

        const result = importBundleData({
          dictionaries: (bundle.dictionaries as any) || [],
          mappings: bundle.mappings || [],
          graphs: bundle.graphs || []
        });

        setReport({
          imported: result.importedCount,
          skipped: result.skippedCount,
          conflicts: result.conflicts
        });
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError(`Import failed: ${err.message}`);
        setReport(null);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col border-t border-zinc-800 bg-zinc-900">
      <div className="p-4 flex items-center justify-between border-b border-zinc-800/50">
        <div className="flex items-center gap-6">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] text-zinc-600 uppercase font-black">Active Organization</label>
            <select 
              value={orgId}
              onChange={(e) => {
                setOrgId(e.target.value);
                setReport(null);
                setError(null);
              }}
              className="bg-black border border-zinc-800 rounded px-2 py-1 text-[10px] text-blue-400 font-bold focus:border-blue-500 outline-none"
            >
              <option value="org_default">Global Default</option>
              <option value="org_seahawks">Seattle Seahawks</option>
              <option value="org_niners">SF 49ers</option>
              <option value="org_finance_hub">Finance Hub</option>
            </select>
          </div>

          <div className="h-8 w-px bg-zinc-800"></div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={handleExport} className="h-7 text-[10px] font-black tracking-widest uppercase">
              Export Bundle
            </Button>
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="h-7 text-[10px] font-black tracking-widest uppercase">
              Import JSON
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImport} 
              className="hidden" 
              accept=".json"
            />
          </div>
        </div>

        <div className="flex flex-col items-end">
          {error && <span className="text-[9px] text-red-500 font-bold uppercase">{error}</span>}
          {!error && !report && (
            <span className="text-[9px] text-zinc-600 uppercase font-black tracking-tighter italic">V1 Snapshot Engine Ready</span>
          )}
        </div>
      </div>

      {report && (
        <div className="bg-black/40 p-3 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Import Report</h5>
            <button onClick={() => setReport(null)} className="text-[10px] text-zinc-600 hover:text-zinc-400">Dismiss</button>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-[8px] text-zinc-600 uppercase font-bold">Imported</span>
              <span className="text-[14px] text-green-400 font-black font-mono">{report.imported}</span>
            </div>
            <div className="flex flex-col border-l border-zinc-800 pl-4">
              <span className="text-[8px] text-zinc-600 uppercase font-bold">Skipped (Conflicts)</span>
              <span className="text-[14px] text-amber-500 font-black font-mono">{report.skipped}</span>
            </div>
          </div>
          {report.conflicts.length > 0 && (
            <div className="max-h-20 overflow-y-auto bg-black/50 rounded p-2 mt-1 border border-zinc-800">
              {report.conflicts.map((c, i) => (
                <div key={i} className="text-[9px] text-zinc-500 font-mono flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-amber-600 shrink-0"></div>
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

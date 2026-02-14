
import React, { useMemo } from 'react';
import { useDataStore, ValidationResult } from '../store/useDataStore';
import { Button } from '../../../shared/components/Button';

export const ValidationAndDeployPanel: React.FC = () => {
  const { 
    validation, 
    validateGraph, 
    deployment, 
    deployToEdge, 
    resetDeployment, 
    copyValidationReport,
    setSelection,
    busState,
    simController
  } = useDataStore();

  const confidenceScore = useMemo(() => {
    let score = 0;
    if (validation.status === 'pass') score += 40;
    if (busState === 'streaming') score += 30;
    if (simController.status === 'running' || simController.status === 'paused') score += 30;
    return score;
  }, [validation.status, busState, simController.status]);

  const sortedValidation = useMemo(() => {
    const groups = { error: [] as ValidationResult[], warning: [] as ValidationResult[], info: [] as ValidationResult[] };
    validation.results.forEach(r => groups[r.type].push(r));
    return groups;
  }, [validation.results]);

  const isDeploying = deployment.status === 'deploying';
  const isDeployed = deployment.status === 'success';

  return (
    <div className="flex flex-col gap-3 w-[320px]">
      {/* Logic Health Summary */}
      <div className="bg-zinc-900/95 backdrop-blur-md p-5 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden relative group">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
            <h4 className="text-[10px] font-black text-zinc-100 uppercase tracking-widest">Pipeline Health</h4>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${confidenceScore > 80 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : confidenceScore > 40 ? 'bg-amber-500' : 'bg-zinc-700'}`}></div>
            <span className="text-[10px] font-mono font-bold text-zinc-400">{confidenceScore}%</span>
          </div>
        </div>
        
        <div className="w-full bg-black h-1.5 rounded-full mb-5 overflow-hidden shadow-inner">
          <div 
            className={`h-full transition-all duration-1000 ${confidenceScore > 80 ? 'bg-green-500' : confidenceScore > 40 ? 'bg-amber-500' : 'bg-blue-600'}`} 
            style={{ width: `${confidenceScore}%` }}
          ></div>
        </div>

        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant={validation.status === 'pass' ? 'secondary' : 'primary'} 
            onClick={validateGraph} 
            disabled={validation.status === 'validating' || isDeploying} 
            className="flex-1 px-4 py-2 font-black uppercase tracking-widest text-[9px] h-9"
          >
            {validation.status === 'validating' ? 'Scanning...' : 'Re-Validate'}
          </Button>
          <Button 
            size="sm" 
            variant="primary" 
            onClick={deployToEdge} 
            disabled={validation.status !== 'pass' || isDeploying} 
            className={`flex-1 px-4 py-2 font-black uppercase tracking-widest text-[9px] h-9 transition-all ${isDeployed ? 'bg-green-600 shadow-green-600/20' : validation.status === 'pass' ? 'bg-blue-600' : 'bg-zinc-800 text-zinc-600'}`}
          >
            {isDeploying ? 'Publishing...' : isDeployed ? 'Live at Edge' : 'Deploy Logic'}
          </Button>
        </div>

        {validation.lastValidated > 0 && (
          <div className="mt-3 text-[7px] text-zinc-600 font-mono uppercase text-center tracking-widest">
            Last Scan: {new Date(validation.lastValidated).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Validation Result Detail */}
      {validation.status !== 'idle' && (
        <div className={`animate-in slide-in-from-top-4 duration-300 p-4 rounded-2xl border flex flex-col gap-3 shadow-xl bg-black/80 backdrop-blur-md ${validation.status === 'pass' ? 'border-green-500/20' : 'border-red-500/20'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-black uppercase tracking-widest ${validation.status === 'pass' ? 'text-green-400' : 'text-red-400'}`}>
              {validation.status === 'pass' ? 'Broadcast Ready' : 'Blockers Found'}
            </span>
            <button onClick={copyValidationReport} className="text-[8px] font-black text-zinc-700 hover:text-zinc-300 uppercase tracking-widest transition-colors">Copy Report</button>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
            {sortedValidation.error.map(err => (
              <div 
                key={err.id} 
                onClick={() => err.nodeId && setSelection('node', err.nodeId)}
                className="p-3 bg-red-950/20 rounded-xl border border-red-900/30 flex flex-col gap-2 group cursor-pointer hover:bg-red-900/10 transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <p className="text-[10px] text-red-200 font-medium leading-tight">{err.message}</p>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><path d="m9 18 6-6-6-6"/></svg>
                </div>
                {err.nodeId && <span className="text-[7px] font-black text-red-600 uppercase tracking-tighter self-end">ID: {err.nodeId.split('-').pop()}</span>}
              </div>
            ))}

            {sortedValidation.warning.map(warn => (
              <div key={warn.id} className="p-3 bg-amber-950/10 rounded-xl border border-amber-900/20">
                <p className="text-[10px] text-amber-100/70 font-medium leading-tight">{warn.message}</p>
              </div>
            ))}

            {sortedValidation.info.map(info => (
              <div key={info.id} className="p-3 bg-blue-950/5 rounded-xl border border-blue-900/10">
                <p className="text-[10px] text-blue-200/50 font-medium leading-tight">{info.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deployment Status (Visible when Deployed) */}
      {isDeployed && (
        <div className="animate-in slide-in-from-bottom-4 duration-500 p-5 bg-green-950/10 border border-green-500/30 rounded-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-600/20 flex items-center justify-center border border-green-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </div>
            <div>
              <span className="text-[10px] font-black text-green-500 uppercase tracking-widest block leading-none">Endpoint Active</span>
              <span className="text-[8px] text-zinc-500 font-mono mt-1 block">ID: {deployment.deployedEndpointId}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="relative group">
              <input 
                readOnly 
                value={deployment.endpointUrl || ''} 
                className="w-full bg-black border border-zinc-800 rounded-lg pl-3 pr-10 py-2 text-[9px] font-mono text-zinc-400 focus:outline-none"
              />
              <button 
                onClick={() => deployment.endpointUrl && navigator.clipboard.writeText(deployment.endpointUrl)}
                className="absolute right-2 top-1.5 p-1 text-zinc-700 hover:text-white transition-colors"
                title="Copy Endpoint"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
            </div>
            <button 
              onClick={resetDeployment}
              className="w-full py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[9px] font-black text-red-500/60 hover:text-red-400 uppercase tracking-widest transition-all"
            >
              Teardown Endpoint
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

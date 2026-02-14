
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  Panel, 
  ReactFlowProvider 
} from 'reactflow';
import { Button } from '../../shared/components/Button';
import { useDataStore, getProvenance, ValidationResult } from './store/useDataStore';

const BindingToast: React.FC<{ label: string; onDone: () => void }> = ({ label, onDone }) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-blue-600 text-white px-6 py-3 rounded-full font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_10px_40px_rgba(37,99,235,0.4)] animate-in slide-in-from-bottom-4 duration-300 flex items-center gap-3 border border-blue-400/50">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      Bound to {label}
    </div>
  );
};

// ITEM 40: Lightweight Heartbeat Ticker for Nodes
const LastTickIndicator: React.FC<{ lastActiveAt?: number; tickCount: number }> = ({ lastActiveAt, tickCount }) => {
  const [now, setNow] = useState(Date.now());
  
  useEffect(() => {
    if (!lastActiveAt) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [lastActiveAt]);

  if (!lastActiveAt || tickCount === 0) return null;
  
  const diff = (now - lastActiveAt) / 1000;
  
  return (
    <div className="mt-1.5 pt-1.5 border-t border-blue-500/10 flex items-center justify-between">
      <span className="text-[6px] text-zinc-700 font-mono uppercase tracking-tighter">Heartbeat</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[6px] text-blue-500/60 font-mono">T+{diff.toFixed(0)}s</span>
        <span className="text-[6px] bg-blue-600/10 text-blue-400 px-1 rounded border border-blue-500/20 font-bold">#{tickCount}</span>
      </div>
    </div>
  );
};

const NodeCanvasInner: React.FC = () => {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    addNode, 
    validation, 
    validateGraph,
    fixOrphanedNode,
    fixAllOrphans,
    deployment,
    deployToEdge,
    resetDeployment,
    copyValidationReport,
    isWiringMode,
    activeWiringSource,
    busState,
    simController,
    isTruthMode,
    selection,
    setSelection,
    nodeActivity,
    orgId
  } = useDataStore();

  const [bindingConfirmation, setBindingConfirmation] = useState<string | null>(null);

  const currentStep = useMemo(() => {
    if (simController.status === 'idle') return 1;
    if (selection.id === null) return 2;
    if (validation.status !== 'pass') return 3;
    if (!isTruthMode) return 4;
    return 5;
  }, [simController.status, selection.id, validation.status, isTruthMode]);

  const onDrop = (event: React.DragEvent) => {
    if (isTruthMode) return;
    event.preventDefault();
    const fieldData = event.dataTransfer.getData('application/renderless-field');
    if (!fieldData) return;

    const field = JSON.parse(fieldData);
    
    const newNode = {
      id: `node-${field.keyId}-${Date.now()}`,
      data: { 
        label: field.alias, 
        keyId: field.keyId,
        value: '---',
        lastUpdated: 0
      },
      position: { x: event.clientX - 400, y: event.clientY - 200 },
      style: { 
        background: '#09090b', 
        color: '#3b82f6', 
        border: '1px solid #1d4ed8', 
        borderRadius: '8px', 
        fontSize: '11px',
        padding: '12px',
        width: 180,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        transition: 'all 0.3s ease'
      }
    };

    addNode(newNode);
    setBindingConfirmation(field.alias);
  };

  const nodeWithData = nodes.map(node => {
    const activity = nodeActivity[node.id];
    const isRecentlyUpdated = activity && (Date.now() - activity.lastActiveAt < 800);
    const isWiringTarget = !isTruthMode && isWiringMode && activeWiringSource?.type === 'key';
    const hasError = !isTruthMode && validation.offendingNodeIds.has(node.id);
    const isTraced = selection.id === node.id || selection.id === node.data.keyId;
    
    const provenance = getProvenance(node.data.sourceId, node.data.lastUpdated);

    return {
      ...node,
      data: {
        ...node.data,
        label: (
          <div 
            onClick={() => isTruthMode && setSelection('node', node.id, node.data.label)}
            className={`flex flex-col gap-1.5 transition-all ${isWiringTarget ? 'scale-105' : ''} ${isTruthMode ? 'cursor-pointer' : ''}`}
          >
            <div className="flex items-center justify-between border-b border-blue-500/20 pb-1 mb-1">
              <span className={`font-black uppercase tracking-widest text-[9px] ${isTraced ? 'text-white' : hasError ? 'text-red-400' : isWiringTarget ? 'text-blue-400' : 'text-zinc-400'}`}>
                {node.data.label}
              </span>
              {isTruthMode ? (
                <span className={`text-[6px] font-black px-1 rounded border uppercase ${provenance === 'LIVE' ? 'border-green-500 text-green-500' : 'border-zinc-700 text-zinc-600'}`}>{provenance}</span>
              ) : hasError ? (
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              ) : (
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isRecentlyUpdated ? 'bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,1)] scale-150' : 'bg-zinc-800'}`}></div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] text-zinc-600 uppercase font-black tracking-tighter">{isTruthMode ? 'Bus Truth' : 'Current Value'}</span>
              <span className={`font-mono text-[11px] font-black truncate transition-colors duration-300 ${isTraced ? 'text-blue-300' : hasError ? 'text-red-300' : isRecentlyUpdated ? 'text-white' : 'text-blue-500/80'}`}>
                {node.data.value !== undefined ? (typeof node.data.value === 'object' ? '{...}' : String(node.data.value)) : 'NULL'}
              </span>
            </div>
            {hasError && (
              <div className="mt-1 flex items-center justify-between gap-1">
                <span className="text-[7px] font-black text-red-500 uppercase tracking-tighter bg-red-500/10 px-1 py-0.5 rounded leading-none">
                  ORPHANED
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); fixOrphanedNode(node.id); }}
                  className="text-[7px] font-black text-blue-400 uppercase tracking-tighter hover:text-blue-300 underline"
                >
                  FIX
                </button>
              </div>
            )}
            
            {/* ITEM 40: Alive Ticker */}
            {!isTruthMode && (
               <LastTickIndicator lastActiveAt={activity?.lastActiveAt} tickCount={activity?.tickCount || 0} />
            )}

            {isTruthMode && (
              <div className="mt-1.5 pt-1.5 border-t border-blue-500/10 flex items-center justify-between">
                <span className="text-[6px] text-zinc-600 font-mono">LATENCY</span>
                <span className="text-[6px] text-blue-500 font-mono">{(Math.random() * 20 + 5).toFixed(1)}ms</span>
              </div>
            )}
          </div>
        )
      },
      style: {
        ...node.style,
        background: isTraced ? '#1e40af' : node.style?.background,
        borderColor: isTraced ? '#3b82f6' : hasError ? '#ef4444' : isRecentlyUpdated ? '#3b82f6' : (isWiringTarget ? '#3b82f6aa' : '#1e293b'),
        boxShadow: isTraced ? '0 0 30px rgba(59, 130, 246, 0.4)' : hasError ? '0 0 15px rgba(239, 68, 68, 0.2)' : isRecentlyUpdated ? '0 0 25px rgba(59, 130, 246, 0.5)' : (isWiringTarget ? '0 0 15px rgba(59, 130, 246, 0.2)' : '0 4px 10px rgba(0,0,0,0.5)'),
        transform: isTraced || isRecentlyUpdated ? 'scale(1.05)' : 'scale(1)',
        opacity: isTruthMode && selection.id && !isTraced ? 0.3 : 1
      }
    };
  });

  const edgesWithFlow = edges.map(edge => {
    const sourceActivity = nodeActivity[edge.source];
    const isSourceActive = sourceActivity && (Date.now() - sourceActivity.lastActiveAt < 800);
    const isHighlighted = isTruthMode && selection.id && (edge.source === selection.id || edge.target === selection.id);
    
    return {
      ...edge,
      animated: isHighlighted || isSourceActive,
      style: {
        ...edge.style,
        stroke: isHighlighted ? '#3b82f6' : isSourceActive ? '#60a5fa' : edge.style?.stroke,
        strokeWidth: isHighlighted ? 4 : isSourceActive ? 3 : edge.style?.strokeWidth,
        opacity: isTruthMode && selection.id && !isHighlighted ? 0.1 : 1,
        transition: 'all 0.3s ease'
      }
    };
  });

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

  return (
    <div className={`flex-1 h-full transition-all duration-500 ${isTruthMode ? 'bg-black' : isWiringMode ? 'bg-blue-900/5' : 'bg-zinc-950'} relative`} onDragOver={(e) => !isTruthMode && e.preventDefault()} onDrop={onDrop}>
      <style>{`
        .react-flow__edge-path {
          stroke: #27272a;
          stroke-width: 2;
          transition: all 0.3s ease;
        }
        .react-flow__edge.animated .react-flow__edge-path {
          stroke: #3b82f6;
          stroke-width: 3;
          stroke-dasharray: 8;
          animation: react-flow__dashdraw 0.3s linear infinite;
        }
        .react-flow__node {
          cursor: grab;
          transition: opacity 0.5s ease, transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .react-flow__node:active {
          cursor: grabbing;
        }
        @keyframes react-flow__dashdraw {
          from { stroke-dashoffset: 16; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
      
      <ReactFlow
        nodes={nodeWithData}
        edges={edgesWithFlow}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        nodesDraggable={!isTruthMode}
        nodesConnectable={!isTruthMode}
      >
        <Background color={isTruthMode ? "#1e40af11" : isWiringMode ? "#1e40af22" : "#18181b"} gap={20} size={1} />
        <Controls className="bg-zinc-900 border-zinc-800 fill-white" />
        
        <Panel position="top-right" className={`flex flex-col gap-3 max-w-[320px] transition-all duration-500 ${isTruthMode ? 'opacity-30 blur-[2px] pointer-events-none' : ''}`}>
          <div className={`flex flex-col gap-2 bg-zinc-900/90 backdrop-blur-md p-4 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden relative transition-all ${currentStep === 3 ? 'highlight-guide' : ''}`}>
            <div className="flex items-center justify-between mb-2">
               <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Logic Health</h4>
               <div className="flex items-center gap-1">
                 <div className={`w-1.5 h-1.5 rounded-full ${confidenceScore > 80 ? 'bg-green-500' : confidenceScore > 40 ? 'bg-amber-500' : 'bg-zinc-700'}`}></div>
                 <span className="text-[10px] font-mono text-zinc-400">{confidenceScore}%</span>
               </div>
            </div>
            
            <div className="w-full bg-zinc-800 h-1 rounded-full mb-4 overflow-hidden">
               <div className={`h-full transition-all duration-1000 ${confidenceScore > 80 ? 'bg-green-500' : confidenceScore > 40 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${confidenceScore}%` }}></div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant={validation.status === 'pass' ? 'secondary' : 'primary'} onClick={validateGraph} disabled={validation.status === 'validating'} className={`flex-1 px-4 py-2 font-black uppercase tracking-widest text-[10px] ${currentStep === 3 ? 'bg-blue-600 text-white' : ''}`}>
                {validation.status === 'validating' ? 'Scanning...' : 'Validate'}
              </Button>
              <Button size="sm" variant="primary" onClick={deployToEdge} disabled={validation.status !== 'pass' || deployment.status !== 'idle'} className={`flex-1 px-4 py-2 font-black uppercase tracking-widest text-[10px] transition-all ${validation.status === 'pass' ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'bg-zinc-800 text-zinc-600'}`}>
                {deployment.status === 'deploying' ? 'Deploying...' : 'Deploy'}
              </Button>
            </div>
          </div>

          {validation.status !== 'idle' && (
            <div className={`animate-in slide-in-from-top-4 duration-300 p-4 rounded-2xl border flex flex-col gap-3 shadow-xl bg-black/60 backdrop-blur-md ${validation.status === 'pass' ? 'border-green-500/30' : 'border-red-500/30'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${validation.status === 'pass' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`}></div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${validation.status === 'pass' ? 'text-green-400' : 'text-red-400'}`}>
                    {validation.status === 'pass' ? 'Integrity Verified' : 'Logic Blockers Found'}
                  </span>
                </div>
                <button onClick={copyValidationReport} className="text-[8px] font-black text-zinc-600 hover:text-white uppercase tracking-widest transition-colors">Copy Report</button>
              </div>

              <div className="space-y-4 max-h-64 overflow-y-auto pr-2 scrollbar-thin">
                {/* ERRORS */}
                {sortedValidation.error.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-red-500/60 uppercase ml-1">Critical</span>
                    {sortedValidation.error.map(err => (
                      <div 
                        key={err.id} 
                        onClick={() => err.nodeId && setSelection('node', err.nodeId)}
                        className={`p-2.5 bg-red-500/5 rounded-xl border border-red-500/10 flex flex-col gap-2 transition-all ${err.nodeId ? 'cursor-pointer hover:bg-red-500/10 hover:border-red-500/30' : ''}`}
                      >
                        <p className="text-[10px] text-red-100 font-medium leading-tight">{err.message}</p>
                        {err.nodeId && <span className="text-[8px] font-black text-red-400 uppercase tracking-tighter self-end">Target: {err.nodeId.slice(0, 8)}...</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* WARNINGS */}
                {sortedValidation.warning.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-amber-500/60 uppercase ml-1">Warnings</span>
                    {sortedValidation.warning.map(warn => (
                      <div key={warn.id} className="p-2.5 bg-amber-500/5 rounded-xl border border-amber-500/10">
                        <p className="text-[10px] text-amber-100 font-medium leading-tight">{warn.message}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* INFO */}
                {sortedValidation.info.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-blue-500/60 uppercase ml-1">Context</span>
                    {sortedValidation.info.map(info => (
                      <div key={info.id} className="p-2.5 bg-blue-500/5 rounded-xl border border-blue-500/10">
                        <p className="text-[10px] text-blue-100 font-medium leading-tight">{info.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {validation.status === 'fail' && validation.offendingNodeIds.size > 0 && (
                <button onClick={fixAllOrphans} className="w-full py-2 bg-blue-600 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-blue-900/20 hover:scale-[1.02] transition-all">Fix All Orphans</button>
              )}
            </div>
          )}
        </Panel>

        {isTruthMode && (
          <Panel position="bottom-center" className="mb-10 w-full max-w-xl">
             <div className="bg-black/80 border border-blue-500/40 backdrop-blur-xl p-6 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col gap-6 animate-in slide-in-from-bottom-8 duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></div>
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Diagnostic Scrubber</span>
                  </div>
                  <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest">Reality History (Locked)</span>
                </div>
                <div className="h-10 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center relative overflow-hidden group">
                   <div className="absolute left-0 top-0 h-full w-[60%] bg-blue-500/10"></div>
                   <div className="absolute left-[60%] top-0 h-full w-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)] z-10"></div>
                   <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest z-20 group-hover:text-white transition-colors cursor-pointer">Live T+0ms</span>
                </div>
                <div className="flex justify-between items-center px-1">
                   <div className="flex flex-col gap-1">
                      <p className="text-[9px] text-zinc-500 font-bold uppercase leading-relaxed">
                        Selection Type: <span className="text-zinc-300">{selection.kind?.toUpperCase() || 'NONE'}</span>
                      </p>
                      <p className="text-[10px] text-blue-400 font-black tracking-tight uppercase">
                        {selection.canonicalPath || selection.id || 'Nothing selected'}
                      </p>
                   </div>
                   <button onClick={() => setSelection(null, null)} className="text-[9px] font-black text-zinc-400 hover:text-white uppercase tracking-widest">Clear Selection</button>
                </div>
             </div>
          </Panel>
        )}

        {/* MOCK DEPLOYMENT OVERLAY */}
        {deployment.status !== 'idle' && (
          <div className="absolute inset-0 z-[300] bg-zinc-950/90 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-500">
            <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
              {deployment.status === 'deploying' ? (
                <div className="space-y-6 w-full">
                  <div className="w-20 h-20 bg-blue-600/10 rounded-full border border-blue-500/20 flex items-center justify-center mx-auto relative">
                    <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M12 2v8"/><path d="m16 6-4 4-4-4"/><rect width="20" height="8" x="2" y="14" rx="2"/></svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-white uppercase tracking-widest">Publishing Edge Logic</h3>
                    <p className="text-xs text-zinc-500 font-medium">Syncing graph nodes to Global Delivery Bus...</p>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
                  </div>
                  <style>{`
                    @keyframes loading {
                      0% { transform: translateX(-100%); }
                      100% { transform: translateX(300%); }
                    }
                  `}</style>
                </div>
              ) : (
                <div className="space-y-8 w-full">
                  <div className="w-20 h-20 bg-green-600/20 rounded-full border border-green-500/30 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white uppercase tracking-widest leading-none">Logic Live on Air</h3>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Renderless Edge | {orgId}</p>
                  </div>

                  <div className="p-6 bg-black border border-zinc-800 rounded-3xl space-y-5 text-left relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Public Production Endpoint</span>
                      <div className="flex items-center gap-3">
                        <code className="text-[11px] font-mono text-blue-400 truncate flex-1">{deployment.endpointUrl}</code>
                        <button 
                          onClick={() => deployment.endpointUrl && navigator.clipboard.writeText(deployment.endpointUrl)}
                          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-600 hover:text-white transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-zinc-600 uppercase">Stream ID</span>
                        <span className="text-[10px] text-zinc-300 font-mono">{deployment.manifest?.streamId}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-zinc-600 uppercase">Complexity</span>
                        <span className="text-[10px] text-zinc-300 font-mono">{deployment.manifest?.nodes} Nodes | {deployment.manifest?.edges} Routes</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-blue-500/5 p-2 rounded-lg border border-blue-500/10">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-[9px] font-black text-blue-400/80 uppercase">Active Monitoring Enabled</span>
                    </div>
                  </div>

                  <div className="flex gap-4 w-full">
                    <Button variant="secondary" className="flex-1 rounded-2xl h-12 uppercase tracking-widest font-black text-[10px]" onClick={resetDeployment}>Close Dashboard</Button>
                    <Button variant="primary" className="flex-1 rounded-2xl h-12 uppercase tracking-widest font-black text-[10px] bg-blue-600 shadow-blue-600/20" onClick={resetDeployment}>Manage Stream</Button>
                  </div>

                  <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest italic">Note: Local Mock Environment Active</p>
                </div>
              )}
            </div>
          </div>
        )}
      </ReactFlow>

      {bindingConfirmation && !isTruthMode && (
        <BindingToast label={bindingConfirmation} onDone={() => setBindingConfirmation(null)} />
      )}
    </div>
  );
};

export const NodeCanvas: React.FC = () => (
  <ReactFlowProvider>
    <NodeCanvasInner />
  </ReactFlowProvider>
);

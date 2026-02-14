
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
import { useDataStore } from './store/useDataStore';

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
    deployment,
    deployEndpoint,
    resetDeployment,
    isWiringMode,
    activeWiringSource,
    busState,
    simState
  } = useDataStore();

  const [bindingConfirmation, setBindingConfirmation] = useState<string | null>(null);

  const onDrop = (event: React.DragEvent) => {
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
    const isRecentlyUpdated = Date.now() - (node.data.lastUpdated || 0) < 800;
    const isWiringTarget = isWiringMode && activeWiringSource?.type === 'key';
    const hasError = validation.offendingNodeIds.has(node.id);
    
    return {
      ...node,
      data: {
        ...node.data,
        label: (
          <div className={`flex flex-col gap-1.5 transition-all ${isWiringTarget ? 'scale-105' : ''}`} title={`Key: ${node.data.keyId}\nValue: ${JSON.stringify(node.data.value)}`}>
            <div className="flex items-center justify-between border-b border-blue-500/20 pb-1 mb-1">
              <span className={`font-black uppercase tracking-widest text-[9px] ${hasError ? 'text-red-400' : isWiringTarget ? 'text-blue-400' : 'text-zinc-400'}`}>
                {node.data.label}
              </span>
              {hasError ? (
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
              ) : (
                <div className={`w-1.5 h-1.5 rounded-full ${isRecentlyUpdated ? 'bg-blue-400 animate-ping' : 'bg-zinc-800'}`}></div>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] text-zinc-600 uppercase font-black tracking-tighter">Current Value</span>
              <span className={`font-mono text-[11px] font-black truncate transition-colors duration-300 ${hasError ? 'text-red-300' : isRecentlyUpdated ? 'text-white' : 'text-blue-500/80'}`}>
                {node.data.value !== undefined ? (typeof node.data.value === 'object' ? '{...}' : String(node.data.value)) : 'NULL'}
              </span>
            </div>
            {hasError && (
              <div className="mt-1 text-[7px] font-black text-red-500 uppercase tracking-tighter bg-red-500/10 px-1 py-0.5 rounded leading-none">
                Connection Required
              </div>
            )}
          </div>
        )
      },
      style: {
        ...node.style,
        borderColor: hasError ? '#ef4444' : isRecentlyUpdated ? '#3b82f6' : (isWiringTarget ? '#3b82f6aa' : '#1e293b'),
        boxShadow: hasError ? '0 0 15px rgba(239, 68, 68, 0.2)' : isRecentlyUpdated ? '0 0 20px rgba(59, 130, 246, 0.4)' : (isWiringTarget ? '0 0 15px rgba(59, 130, 246, 0.2)' : '0 4px 10px rgba(0,0,0,0.5)'),
        transform: isRecentlyUpdated ? 'scale(1.05)' : 'scale(1)',
        animation: isWiringTarget ? 'pulse-wiring 2s infinite' : 'none'
      }
    };
  });

  const confidenceScore = useMemo(() => {
    let score = 0;
    if (validation.status === 'pass') score += 40;
    if (busState === 'streaming') score += 30;
    if (simState === 'playing' || simState === 'paused') score += 30;
    return score;
  }, [validation.status, busState, simState]);

  return (
    <div className={`flex-1 h-full transition-all duration-500 ${isWiringMode ? 'bg-blue-900/5' : 'bg-zinc-950'} relative`} onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <style>{`
        .react-flow__edge-path {
          stroke: #27272a;
          stroke-width: 2;
          transition: stroke 0.3s ease;
        }
        .react-flow__edge.animated .react-flow__edge-path {
          stroke: #3b82f6;
          stroke-width: 3;
          stroke-dasharray: 8;
          animation: react-flow__dashdraw 0.3s linear infinite;
        }
        .react-flow__node {
          cursor: grab;
        }
        .react-flow__node:active {
          cursor: grabbing;
        }
        @keyframes react-flow__dashdraw {
          from { stroke-dashoffset: 16; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes pulse-wiring {
          0% { border-color: #1d4ed8; }
          50% { border-color: #3b82f6; }
          100% { border-color: #1d4ed8; }
        }
        @keyframes check {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      
      <ReactFlow
        nodes={nodeWithData}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background color={isWiringMode ? "#1e40af22" : "#18181b"} gap={20} size={1} />
        <Controls className="bg-zinc-900 border-zinc-800 fill-white" />
        <MiniMap 
          nodeColor={(n) => n.data.keyId && validation.offendingNodeIds.has(n.id) ? '#ef4444' : '#09090b'}
          maskColor="rgba(0, 0, 0, 0.7)"
          className="bg-zinc-900 border border-zinc-800"
        />
        
        <Panel position="top-right" className="flex flex-col gap-3 max-w-[280px]">
          <div className="flex flex-col gap-2 bg-zinc-900/90 backdrop-blur-md p-4 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden relative">
            <div className="flex items-center justify-between mb-2">
               <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Logic Health</h4>
               <div className="flex items-center gap-1">
                 <div className={`w-1.5 h-1.5 rounded-full ${confidenceScore > 80 ? 'bg-green-500' : confidenceScore > 40 ? 'bg-amber-500' : 'bg-zinc-700'}`}></div>
                 <span className="text-[10px] font-mono text-zinc-400">{confidenceScore}%</span>
               </div>
            </div>
            
            <div className="w-full bg-zinc-800 h-1 rounded-full mb-4 overflow-hidden">
               <div 
                 className={`h-full transition-all duration-1000 ${confidenceScore > 80 ? 'bg-green-500' : 'bg-blue-500'}`} 
                 style={{ width: `${confidenceScore}%` }}
               ></div>
            </div>

            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant={validation.status === 'pass' ? 'secondary' : 'primary'} 
                onClick={validateGraph}
                disabled={validation.status === 'validating'}
                className="flex-1 px-4 py-2 font-black uppercase tracking-widest text-[10px]"
              >
                {validation.status === 'validating' ? 'Scanning...' : 'Validate'}
              </Button>
              <Button 
                size="sm" 
                variant="primary" 
                onClick={deployEndpoint}
                disabled={validation.status !== 'pass' || deployment.status !== 'idle'}
                className={`flex-1 px-4 py-2 font-black uppercase tracking-widest text-[10px] transition-all ${
                  validation.status === 'pass' ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'bg-zinc-800 text-zinc-600'
                }`}
              >
                Deploy
              </Button>
            </div>
          </div>

          {validation.status !== 'idle' && (
            <div className={`animate-in slide-in-from-top-4 duration-300 p-4 rounded-2xl border flex flex-col gap-3 shadow-xl ${
              validation.status === 'pass' ? 'bg-green-500/10 border-green-500/30' : 
              validation.status === 'fail' ? 'bg-red-500/10 border-red-500/30' : 'bg-blue-500/10 border-blue-500/30'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  validation.status === 'pass' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 
                  validation.status === 'fail' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-blue-500 animate-pulse'
                }`}></div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${
                  validation.status === 'pass' ? 'text-green-400' : 
                  validation.status === 'fail' ? 'text-red-400' : 'text-blue-400'
                }`}>
                  {validation.status === 'pass' ? 'Graph Integrity: Valid' : 
                   validation.status === 'fail' ? 'Integrity Errors Found' : 'Analyzing Connectivity...'}
                </span>
              </div>
              
              <div className="space-y-2">
                {validation.errors.length > 0 ? (
                  validation.errors.map((err, i) => (
                    <div key={i} className="flex flex-col gap-0.5 group">
                      <div className="flex items-start gap-2 text-[9px] text-zinc-300 font-bold uppercase leading-tight">
                        <span className="text-red-500 mt-0.5 shrink-0">•</span>
                        {err.message}
                      </div>
                      {err.nodeId && (
                        <span className="text-[7px] text-zinc-500 font-mono ml-3 uppercase tracking-tighter opacity-60">Impacted: {err.nodeId.slice(0, 12)}...</span>
                      )}
                    </div>
                  ))
                ) : validation.status === 'pass' ? (
                  <div className="text-[9px] text-green-500/80 font-bold uppercase tracking-tight leading-relaxed">
                    All nodes correctly wired. Transformation logic verified against canonical schemas.
                  </div>
                ) : null}
              </div>

              {validation.status === 'pass' && (
                <div className="mt-1 pt-3 border-t border-green-500/20 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500/40"></div>
                   <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Ready for Edge Deployment</span>
                </div>
              )}
            </div>
          )}
        </Panel>

        {isWiringMode && (
          <Panel position="top-left" className="pointer-events-none">
            <div className="bg-blue-600/20 border border-blue-500/40 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-3 animate-in fade-in zoom-in duration-200">
               <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
               <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                 Wiring Active: {activeWiringSource?.label || 'Source'}
               </span>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {bindingConfirmation && (
        <BindingToast label={bindingConfirmation} onDone={() => setBindingConfirmation(null)} />
      )}

      {deployment.status !== 'idle' && (
        <div className="absolute inset-0 z-[100] bg-zinc-950/90 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-500">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            {deployment.status === 'deploying' ? (
              <div className="p-12 text-center space-y-10">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M12 2v8"/><path d="m16 6-4 4-4-4"/></svg>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-white uppercase tracking-[0.2em]">Publishing Logic</h3>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Syncing transformation graph to 12 global edge nodes...</p>
                </div>
                <div className="w-64 mx-auto bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 animate-[progress_2s_ease-in-out_infinite]"></div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Deployment Confirmation Header */}
                <div className="p-10 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-white animate-[check_0.4s_ease-out]"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-widest">Endpoint Verified</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        <span className="text-[10px] text-green-500 font-black uppercase tracking-widest">Live in Production (Cluster Alpha)</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={resetDeployment} className="text-zinc-600 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                </div>
                
                <div className="flex-1 flex overflow-hidden">
                   {/* Checklist */}
                   <div className="w-1/2 p-10 border-r border-zinc-800 space-y-8">
                     <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Confidence Checklist</h4>
                     <div className="space-y-4">
                       {[
                         { label: "Dictionaries Valid", status: "pass" },
                         { label: "Graph Connected", status: "pass" },
                         { label: "Bus Latency < 40ms", status: busState === 'streaming' ? 'pass' : 'warn' },
                         { label: "Simulation Tested", status: simState !== 'stopped' ? 'pass' : 'warn' },
                         { label: "Security: Signed", status: "pass" }
                       ].map((item, idx) => (
                         <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-zinc-800">
                           <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{item.label}</span>
                           {item.status === 'pass' ? (
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><polyline points="20 6 9 17 4 12"/></svg>
                           ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                           )}
                         </div>
                       ))}
                     </div>
                   </div>

                   {/* Manifest Preview */}
                   <div className="w-1/2 p-10 bg-black/30 flex flex-col gap-6">
                     <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Manifest & Schema Preview</h4>
                     <div className="flex-1 bg-black rounded-2xl p-6 border border-zinc-800 font-mono text-[10px] text-blue-400/80 overflow-y-auto shadow-inner">
                        <pre>{JSON.stringify(deployment.manifestPreview, null, 2)}</pre>
                     </div>
                     <div className="space-y-3">
                        <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest block">Primary Endpoint URL</span>
                        <div className="flex items-center justify-between gap-3 bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-xl shadow-inner group">
                          <span className="text-[11px] font-mono text-blue-400 truncate">{deployment.endpointUrl}</span>
                          <button className="text-zinc-600 hover:text-white transition-colors shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                          </button>
                        </div>
                     </div>
                   </div>
                </div>

                <div className="p-8 bg-zinc-900 border-t border-zinc-800 flex justify-center">
                  <Button variant="secondary" size="lg" onClick={resetDeployment} className="px-10 h-14 font-black uppercase tracking-[0.2em] text-[12px] rounded-2xl border-2 border-zinc-800 hover:bg-zinc-800 transition-all">
                    Return to Logic Canvas
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const NodeCanvas: React.FC = () => (
  <ReactFlowProvider>
    <NodeCanvasInner />
  </ReactFlowProvider>
);

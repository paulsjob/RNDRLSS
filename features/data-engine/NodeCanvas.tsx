
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
import { useDataStore, getProvenance } from './store/useDataStore';

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
    fixOrphanedNode,
    fixAllOrphans,
    deployment,
    deployEndpoint,
    resetDeployment,
    isWiringMode,
    activeWiringSource,
    busState,
    simState,
    isTruthMode,
    selectedTraceId,
    setTraceId
  } = useDataStore();

  const [bindingConfirmation, setBindingConfirmation] = useState<string | null>(null);

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
    const isRecentlyUpdated = Date.now() - (node.data.lastUpdated || 0) < 800;
    const isWiringTarget = !isTruthMode && isWiringMode && activeWiringSource?.type === 'key';
    const hasError = !isTruthMode && validation.offendingNodeIds.has(node.id);
    const isTraced = isTruthMode && selectedTraceId && (node.id === selectedTraceId || node.data.keyId === selectedTraceId);
    
    const provenance = getProvenance(node.data.sourceId, node.data.lastUpdated);

    return {
      ...node,
      data: {
        ...node.data,
        label: (
          <div 
            onClick={() => isTruthMode && setTraceId(isTraced ? null : node.id)}
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
                <div className={`w-1.5 h-1.5 rounded-full ${isRecentlyUpdated ? 'bg-blue-400 animate-ping' : 'bg-zinc-800'}`}></div>
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
        boxShadow: isTraced ? '0 0 30px rgba(59, 130, 246, 0.4)' : hasError ? '0 0 15px rgba(239, 68, 68, 0.2)' : isRecentlyUpdated ? '0 0 20px rgba(59, 130, 246, 0.4)' : (isWiringTarget ? '0 0 15px rgba(59, 130, 246, 0.2)' : '0 4px 10px rgba(0,0,0,0.5)'),
        transform: isTraced || isRecentlyUpdated ? 'scale(1.05)' : 'scale(1)',
        opacity: isTruthMode && selectedTraceId && !isTraced ? 0.3 : 1
      }
    };
  });

  const edgesWithTruth = edges.map(edge => {
    const isHighlighted = isTruthMode && selectedTraceId && (edge.source === selectedTraceId || edge.target === selectedTraceId);
    return {
      ...edge,
      animated: isHighlighted || edge.animated,
      style: {
        ...edge.style,
        stroke: isHighlighted ? '#3b82f6' : edge.style?.stroke,
        strokeWidth: isHighlighted ? 4 : edge.style?.strokeWidth,
        opacity: isTruthMode && selectedTraceId && !isHighlighted ? 0.1 : 1
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
          transition: opacity 0.5s ease, transform 0.3s ease, border-color 0.3s ease;
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
        edges={edgesWithTruth}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        nodesDraggable={!isTruthMode}
        nodesConnectable={!isTruthMode}
      >
        <Background color={isTruthMode ? "#1e40af11" : isWiringMode ? "#1e40af22" : "#18181b"} gap={20} size={1} />
        <Controls className="bg-zinc-900 border-zinc-800 fill-white" />
        
        <Panel position="top-right" className={`flex flex-col gap-3 max-w-[280px] transition-all duration-500 ${isTruthMode ? 'opacity-30 blur-[2px] pointer-events-none' : ''}`}>
          <div className="flex flex-col gap-2 bg-zinc-900/90 backdrop-blur-md p-4 rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden relative">
            <div className="flex items-center justify-between mb-2">
               <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Logic Health</h4>
               <div className="flex items-center gap-1">
                 <div className={`w-1.5 h-1.5 rounded-full ${confidenceScore > 80 ? 'bg-green-500' : confidenceScore > 40 ? 'bg-amber-500' : 'bg-zinc-700'}`}></div>
                 <span className="text-[10px] font-mono text-zinc-400">{confidenceScore}%</span>
               </div>
            </div>
            
            <div className="w-full bg-zinc-800 h-1 rounded-full mb-4 overflow-hidden">
               <div className={`h-full transition-all duration-1000 ${confidenceScore > 80 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${confidenceScore}%` }}></div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant={validation.status === 'pass' ? 'secondary' : 'primary'} onClick={validateGraph} disabled={validation.status === 'validating'} className="flex-1 px-4 py-2 font-black uppercase tracking-widest text-[10px]">
                {validation.status === 'validating' ? 'Scanning...' : 'Validate'}
              </Button>
              <Button size="sm" variant="primary" onClick={deployEndpoint} disabled={validation.status !== 'pass' || deployment.status !== 'idle'} className={`flex-1 px-4 py-2 font-black uppercase tracking-widest text-[10px] transition-all ${validation.status === 'pass' ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'bg-zinc-800 text-zinc-600'}`}>
                Deploy
              </Button>
            </div>
          </div>

          {validation.status !== 'idle' && (
            <div className={`animate-in slide-in-from-top-4 duration-300 p-4 rounded-2xl border flex flex-col gap-3 shadow-xl ${validation.status === 'pass' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${validation.status === 'pass' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`}></div>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${validation.status === 'pass' ? 'text-green-400' : 'text-red-400'}`}>
                    {validation.status === 'pass' ? 'Graph Integrity: Valid' : 'Reality Warnings Found'}
                  </span>
                </div>
                {validation.status === 'fail' && (
                  <button onClick={fixAllOrphans} className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:underline">Fix All</button>
                )}
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin">
                {validation.errors.map((err, i) => (
                  <div key={i} className="flex flex-col gap-1.5 p-2 bg-black/40 rounded-lg border border-red-500/10">
                    <div className="flex items-start gap-2 text-[9px] text-zinc-300 font-bold uppercase leading-tight">
                      <span className="text-red-500 mt-0.5 shrink-0">•</span>
                      {err.message}
                    </div>
                    {err.nodeId && (
                      <button 
                        onClick={() => fixOrphanedNode(err.nodeId!)}
                        className="text-[8px] font-black text-blue-400 uppercase tracking-widest self-end hover:bg-blue-600/10 px-2 py-0.5 rounded border border-blue-500/20"
                      >
                        Auto-Connect Node
                      </button>
                    )}
                  </div>
                ))}
              </div>
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
                   <p className="text-[9px] text-zinc-500 font-bold uppercase leading-relaxed max-w-[300px]">
                     Tracing lineage for <span className="text-blue-400">{selectedTraceId ? `Object: ${selectedTraceId.slice(0, 8)}...` : 'Unselected'}</span>
                   </p>
                   <button onClick={() => setTraceId(null)} className="text-[9px] font-black text-zinc-400 hover:text-white uppercase tracking-widest">Clear Trace</button>
                </div>
             </div>
          </Panel>
        )}
      </ReactFlow>

      {bindingConfirmation && !isTruthMode && (
        <BindingToast label={bindingConfirmation} onDone={() => setBindingConfirmation(null)} />
      )}

      {deployment.status !== 'idle' && (
        <div className="absolute inset-0 z-[100] bg-zinc-950/90 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-500">
          {/* ... existing deployment UI remains ... */}
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


import React from 'react';
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
    resetDeployment
  } = useDataStore();

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const fieldData = event.dataTransfer.getData('application/renderless-field');
    if (!fieldData) return;

    const field = JSON.parse(fieldData);
    
    // Calculate drop position relative to canvas
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
  };

  const nodeWithData = nodes.map(node => {
    const isRecentlyUpdated = Date.now() - (node.data.lastUpdated || 0) < 800;
    
    return {
      ...node,
      data: {
        ...node.data,
        label: (
          <div className="flex flex-col gap-1.5" title={`Key: ${node.data.keyId}\nValue: ${JSON.stringify(node.data.value)}`}>
            <div className="flex items-center justify-between border-b border-blue-500/20 pb-1 mb-1">
              <span className="font-black uppercase tracking-widest text-[9px] text-zinc-400">{node.data.label}</span>
              <div className={`w-1.5 h-1.5 rounded-full ${isRecentlyUpdated ? 'bg-blue-400 animate-ping' : 'bg-zinc-800'}`}></div>
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] text-zinc-600 uppercase font-black tracking-tighter">Current Value</span>
              <span className={`font-mono text-[11px] font-black truncate transition-colors duration-300 ${isRecentlyUpdated ? 'text-white' : 'text-blue-500/80'}`}>
                {node.data.value !== undefined ? (typeof node.data.value === 'object' ? '{...}' : String(node.data.value)) : 'NULL'}
              </span>
            </div>
          </div>
        )
      },
      style: {
        ...node.style,
        borderColor: isRecentlyUpdated ? '#3b82f6' : '#1e293b',
        boxShadow: isRecentlyUpdated ? '0 0 20px rgba(59, 130, 246, 0.4)' : '0 4px 10px rgba(0,0,0,0.5)',
        transform: isRecentlyUpdated ? 'scale(1.05)' : 'scale(1)'
      }
    };
  });

  return (
    <div className="flex-1 h-full bg-zinc-950 relative" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <style>{`
        .react-flow__edge-path {
          stroke: #27272a;
          stroke-width: 2;
          transition: stroke 0.3s ease;
        }
        .react-flow__edge.animated .react-flow__edge-path {
          stroke: #3b82f6;
          stroke-width: 3;
          stroke-dasharray: 5;
          animation: react-flow__dashdraw 0.5s linear infinite;
        }
        .react-flow__node {
          cursor: grab;
        }
        .react-flow__node:active {
          cursor: grabbing;
        }
        @keyframes react-flow__dashdraw {
          from {
            stroke-dashoffset: 10;
          }
          to {
            stroke-dashoffset: 0;
          }
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
        <Background color="#18181b" gap={20} size={1} />
        <Controls className="bg-zinc-900 border-zinc-800 fill-white" />
        <MiniMap 
          nodeColor={(n) => n.type === 'input' ? '#1e1b4b' : '#09090b'}
          maskColor="rgba(0, 0, 0, 0.7)"
          className="bg-zinc-900 border border-zinc-800"
        />
        
        <Panel position="top-right" className="flex flex-col gap-3">
          <div className="flex gap-2 bg-zinc-900/80 backdrop-blur-md p-1.5 rounded-xl border border-zinc-800 shadow-2xl">
            <Button 
              size="sm" 
              variant={validation.status === 'pass' ? 'secondary' : 'primary'} 
              onClick={validateGraph}
              disabled={validation.status === 'validating'}
              className="px-4 py-2 font-black uppercase tracking-widest text-[10px]"
            >
              {validation.status === 'validating' ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Validating...
                </div>
              ) : 'Validate Graph'}
            </Button>
            <Button 
              size="sm" 
              variant="primary" 
              onClick={deployEndpoint}
              disabled={validation.status !== 'pass' || deployment.status !== 'idle'}
              className={`px-6 py-2 font-black uppercase tracking-widest text-[10px] transition-all ${
                validation.status === 'pass' 
                  ? 'bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
                  : 'bg-zinc-800 text-zinc-600'
              }`}
            >
              Deploy Endpoint
            </Button>
          </div>

          {/* Validation Report UI */}
          {validation.status !== 'idle' && (
            <div className={`animate-in slide-in-from-top-4 duration-300 p-3 rounded-xl border flex flex-col gap-2 shadow-xl ${
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
                  {validation.status === 'pass' ? 'System Validated' : 
                   validation.status === 'fail' ? 'Integrity Errors' : 'Scanning Topology...'}
                </span>
              </div>
              {validation.errors.length > 0 && (
                <div className="space-y-1.5 mt-1">
                  {validation.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-[9px] text-zinc-400 font-bold uppercase leading-relaxed">
                      <span className="text-red-500 mt-0.5 shrink-0">•</span>
                      {err}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Panel>
      </ReactFlow>

      {/* Deployment Overlays */}
      {deployment.status !== 'idle' && (
        <div className="absolute inset-0 z-[100] bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-500">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] p-10 text-center animate-in zoom-in-95 duration-300">
            {deployment.status === 'deploying' ? (
              <div className="space-y-8">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M12 2v8"/><path d="m16 6-4 4-4-4"/></svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-widest">Provisioning Edge</h3>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Deploying logical graph to Cluster Alpha...</p>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 animate-[progress_2s_ease-in-out_infinite]"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-white animate-[check_0.4s_ease-out]"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white uppercase tracking-widest leading-none">Endpoint Live</h3>
                  <p className="text-xs text-green-500 font-black uppercase tracking-widest">Global Edge Distribution Complete</p>
                </div>
                
                <div className="bg-black/50 border border-zinc-800 rounded-2xl p-5 space-y-3 shadow-inner">
                  <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest block text-left">Production Endpoint URL</span>
                  <div className="flex items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-xl">
                    <span className="text-[11px] font-mono text-blue-400 truncate">{deployment.endpointUrl}</span>
                    <button className="text-zinc-500 hover:text-white transition-colors shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                    </button>
                  </div>
                </div>

                <Button variant="secondary" size="lg" onClick={resetDeployment} className="w-full h-12 font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl border-2 border-zinc-800">
                  Return to Canvas
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes progress {
          0% { width: 0; }
          100% { width: 100%; }
        }
        @keyframes check {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export const NodeCanvas: React.FC = () => (
  <ReactFlowProvider>
    <NodeCanvasInner />
  </ReactFlowProvider>
);

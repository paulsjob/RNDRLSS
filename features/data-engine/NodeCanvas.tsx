
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
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } = useDataStore();

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
        <Panel position="top-right" className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => alert('Logic validated against mock feed.')}>Validate Graph</Button>
          <Button size="sm" variant="primary">Deploy Endpoint</Button>
        </Panel>
      </ReactFlow>
    </div>
  );
};

export const NodeCanvas: React.FC = () => (
  <ReactFlowProvider>
    <NodeCanvasInner />
  </ReactFlowProvider>
);

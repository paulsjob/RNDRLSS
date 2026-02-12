
import React from 'react';
// Fixed: Explicitly using named exports for all ReactFlow components and the provider
// to resolve "no exported member" errors which can occur in certain TypeScript/ESM configurations.
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  Panel, 
  ReactFlowProvider 
} from 'reactflow';
// Removed CSS import here as it is now handled in index.html to avoid MIME type errors
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
      id: `node-${Date.now()}`,
      data: { label: `${field.label} Source` },
      position: { x: event.clientX - 400, y: event.clientY - 200 },
      style: { 
        background: '#09090b', 
        color: '#3b82f6', 
        border: '1px solid #1d4ed8', 
        borderRadius: '6px', 
        fontSize: '10px',
        padding: '10px',
        width: 150
      }
    };

    addNode(newNode);
  };

  return (
    <div className="flex-1 h-full bg-zinc-950 relative" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background color="#27272a" gap={20} size={1} />
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

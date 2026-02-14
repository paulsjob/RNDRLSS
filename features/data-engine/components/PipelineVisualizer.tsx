
import React, { useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
// Added missing Button import for UI elements
import { Button } from '../../../shared/components/Button';

export const PipelineVisualizer: React.FC = () => {
  const { goldenPath } = useDataStore();
  
  const isUpdating = Date.now() - goldenPath.lastUpdateTs < 500;

  const nodes = [
    { id: 'raw', label: 'Raw Input', value: goldenPath.rawInput, color: 'zinc' },
    { id: 'transform', label: 'Transform', value: String(goldenPath.transformedValue), color: 'blue' },
    { id: 'bus', label: 'Live Bus', value: 'Active (Alpha)', color: 'green' },
    { id: 'bound', label: 'Bound Field', value: goldenPath.isBound ? goldenPath.bindingTarget : 'Unbound', color: goldenPath.isBound ? 'blue' : 'zinc' },
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-12">
      <div className="relative flex flex-col items-center gap-16 w-full max-w-lg">
        
        {/* Connection Line */}
        <div className="absolute inset-y-0 w-1 bg-zinc-800 rounded-full left-1/2 -translate-x-1/2 -z-10">
           <div 
             className={`absolute inset-0 bg-blue-500 transition-all duration-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] ${isUpdating ? 'opacity-100 translate-y-0 scale-y-100' : 'opacity-0 -translate-y-full scale-y-0'}`}
           />
        </div>

        {nodes.map((node, i) => (
          <div 
            key={node.id}
            className={`relative w-full max-w-xs group transition-all duration-500 ${isUpdating && node.id !== 'bound' ? 'scale-[1.02]' : ''}`}
          >
            {/* Connection Arrow */}
            {i < nodes.length - 1 && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 h-16 w-px border-l border-dashed border-zinc-700 z-0"></div>
            )}

            <div 
              className={`p-6 rounded-[2rem] border-2 transition-all duration-500 backdrop-blur-xl flex flex-col items-center text-center shadow-2xl relative overflow-hidden ${
                isUpdating ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.2)] bg-blue-500/5' : 
                node.id === 'bound' && !goldenPath.isBound ? 'border-zinc-800 bg-zinc-950/80 grayscale opacity-40' :
                'border-zinc-800 bg-zinc-950/80'
              }`}
            >
              {/* Node Indicator */}
              <div className={`absolute top-0 left-0 w-full h-1 bg-${node.color}-500 opacity-20 group-hover:opacity-100 transition-opacity`}></div>

              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3">{node.label}</span>
              
              <div className="bg-black/50 rounded-2xl p-4 border border-zinc-800/50 w-full shadow-inner overflow-hidden">
                <span className={`text-lg font-mono font-black truncate block tracking-tight ${isUpdating ? 'text-white' : `text-${node.color}-400`}`}>
                  {node.value || '...'}
                </span>
              </div>

              {/* Status Badge */}
              <div className="mt-4 flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isUpdating ? 'bg-blue-400 animate-ping' : node.id === 'bound' && !goldenPath.isBound ? 'bg-zinc-800' : 'bg-green-500/50'}`}></div>
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                  {node.id === 'transform' ? 'Passthrough OK' : 
                   node.id === 'bus' ? 'Distributed' : 
                   node.id === 'bound' ? (goldenPath.isBound ? 'Graphic Updated' : 'Standby') : 'Ready'}
                </span>
              </div>
              
              {/* Tooltip */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity bg-black/90 flex items-center justify-center p-4">
                 <p className="text-[9px] text-zinc-400 font-bold uppercase leading-relaxed tracking-wider">
                   {node.id === 'raw' && 'The entry point for external telemetry data.'}
                   {node.id === 'transform' && 'Normalize raw keys into platform-standard units.'}
                   {node.id === 'bus' && 'High-frequency broadcast data distribution tier.'}
                   {node.id === 'bound' && 'Pixel-perfect UI reflection of live values.'}
                 </p>
              </div>
            </div>
          </div>
        ))}

        {/* "Bind" Floating Action */}
        {!goldenPath.isBound && (
          <div className="absolute bottom-16 right-[-80px] animate-bounce">
             {/* FIX: Ensure Button is imported and used correctly for binding actions */}
             <Button 
               variant="primary" 
               size="sm" 
               onClick={() => useDataStore.getState().bindToGraphic("Home Score")}
               className="rounded-full px-6 py-2 shadow-2xl border border-blue-400 shadow-blue-600/30 font-black uppercase text-[10px] tracking-widest"
             >
               Bind Pipeline
             </Button>
          </div>
        )}
      </div>
    </div>
  );
};

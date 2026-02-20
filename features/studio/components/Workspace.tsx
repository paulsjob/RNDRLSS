
import React, { useRef, useState, useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { RESOLUTIONS, LayerType, AspectRatio } from '../../../shared/types';
import { resolveResponsiveLayers } from '../../../services/resolver';
import { TextLayerRenderer } from './TextLayerRenderer';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignVerticalJustifyStart as AlignTop, 
  AlignVerticalJustifyCenter as AlignMiddle, 
  AlignVerticalJustifyEnd as AlignBottom,
  AlignHorizontalDistributeCenter as LayoutHorizontal,
  AlignVerticalDistributeCenter as LayoutVertical
} from 'lucide-react';

export const Workspace: React.FC = () => {
  const { currentTemplate, ui, selection, selectLayer, updateLayerTransform, alignLayers, distributeLayers, setAlignTo } = useStudioStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffsets, setDragOffsets] = useState<Record<string, { x: number, y: number }>>({});

  const activeRes = RESOLUTIONS[ui.activeResolution] || RESOLUTIONS.BROADCAST;
  const canvasWidth = activeRes.width;
  const canvasHeight = activeRes.height;

  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;
      const padding = 120; // Increased padding for toolbar
      const { clientWidth, clientHeight } = containerRef.current;
      const s = Math.min(
        (clientWidth - padding) / canvasWidth,
        (clientHeight - padding) / canvasHeight
      );
      setScale(s);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [canvasWidth, canvasHeight, ui.leftPanelOpen, ui.rightPanelOpen]);

  if (!currentTemplate) return null;

  const resolvedLayers = resolveResponsiveLayers(currentTemplate, activeRes.ratio);

  const handleMouseDown = (e: React.MouseEvent, layerId: string) => {
    e.stopPropagation();
    
    const isMulti = e.ctrlKey || e.metaKey;
    const isRange = e.shiftKey;
    
    // If clicking a layer that isn't selected and not holding modifiers, select just it
    if (!selection.selectedLayerIds.includes(layerId) && !isMulti && !isRange) {
      selectLayer(layerId);
    } else if (isMulti || isRange) {
      selectLayer(layerId, isMulti, isRange);
    }

    // Prepare drag offsets for all selected layers (including the one just clicked)
    const currentSelectedIds = (isMulti || isRange || selection.selectedLayerIds.includes(layerId))
      ? (selection.selectedLayerIds.includes(layerId) ? selection.selectedLayerIds : [...selection.selectedLayerIds, layerId])
      : [layerId];

    const offsets: Record<string, { x: number, y: number }> = {};
    currentSelectedIds.forEach(id => {
      const layer = currentTemplate.layers.find(l => l.id === id);
      if (layer && !layer.locked) {
        offsets[id] = {
          x: e.clientX - (layer.transform.x * scale),
          y: e.clientY - (layer.transform.y * scale)
        };
      }
    });

    setDragOffsets(offsets);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    Object.entries(dragOffsets).forEach(([id, offset]) => {
      const off = offset as { x: number, y: number };
      updateLayerTransform(id, {
        x: (e.clientX - off.x) / scale,
        y: (e.clientY - off.y) / scale
      });
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div 
      ref={containerRef}
      className="flex-1 bg-zinc-950 flex flex-col items-center justify-center relative overflow-hidden group select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={() => selectLayer(null)}
    >
      {/* Alignment Toolbar */}
      {selection.selectedLayerIds.length > 0 && (
        <div className="absolute top-6 z-50 flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-1.5 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center border-r border-zinc-800 pr-1 mr-1">
            <button onClick={() => alignLayers('left', ui.alignTo === 'canvas' ? 'comp' : 'selection')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-blue-400 transition-colors" title="Align Left"><AlignLeft size={16} /></button>
            <button onClick={() => alignLayers('center', ui.alignTo === 'canvas' ? 'comp' : 'selection')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-blue-400 transition-colors" title="Align Center"><AlignCenter size={16} /></button>
            <button onClick={() => alignLayers('right', ui.alignTo === 'canvas' ? 'comp' : 'selection')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-blue-400 transition-colors" title="Align Right"><AlignRight size={16} /></button>
          </div>
          <div className="flex items-center border-r border-zinc-800 pr-1 mr-1">
            <button onClick={() => alignLayers('top', ui.alignTo === 'canvas' ? 'comp' : 'selection')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-blue-400 transition-colors" title="Align Top"><AlignTop size={16} /></button>
            <button onClick={() => alignLayers('middle', ui.alignTo === 'canvas' ? 'comp' : 'selection')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-blue-400 transition-colors" title="Align Middle"><AlignMiddle size={16} /></button>
            <button onClick={() => alignLayers('bottom', ui.alignTo === 'canvas' ? 'comp' : 'selection')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-blue-400 transition-colors" title="Align Bottom"><AlignBottom size={16} /></button>
          </div>
          <div className="flex items-center">
            <button onClick={() => distributeLayers('horizontal')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-blue-400 transition-colors" title="Distribute Horizontal"><LayoutHorizontal size={16} /></button>
            <button onClick={() => distributeLayers('vertical')} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-blue-400 transition-colors" title="Distribute Vertical"><LayoutVertical size={16} /></button>
          </div>
          <div className="h-4 w-px bg-zinc-800 mx-1"></div>
          <select 
            className="bg-transparent text-[10px] font-bold text-zinc-500 uppercase tracking-widest outline-none cursor-pointer hover:text-zinc-300 px-2"
            value={ui.alignTo}
            onChange={(e) => setAlignTo(e.target.value as 'selection' | 'canvas')}
          >
            <option value="selection">Selection</option>
            <option value="canvas">Canvas</option>
          </select>
        </div>
      )}

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      <div className="absolute bottom-4 right-4 flex gap-4 items-center">
        <div className="px-2 py-1 rounded bg-black/50 border border-zinc-800 text-[10px] font-mono text-zinc-500 uppercase">
          Zoom: {Math.round(scale * 100)}%
        </div>
      </div>

      <div 
        className="bg-black shadow-[0_0_100px_rgba(0,0,0,0.5)] relative border border-zinc-800 overflow-hidden will-change-transform"
        style={{
          width: canvasWidth,
          height: canvasHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'center center'
        }}
      >
        {resolvedLayers.map((layer) => {
          if (!layer.visible) return null;
          const isSelected = selection.selectedLayerIds.includes(layer.id);
          const isPulsing = ui.lastPulseLayerId === layer.id;
          const { transform, type, content } = layer;

          return (
            <div
              key={layer.id}
              onMouseDown={(e) => handleMouseDown(e, layer.id)}
              className={`absolute cursor-move transition-all duration-300 ${isSelected ? 'ring-2 ring-blue-500 z-10' : 'hover:ring-1 hover:ring-zinc-600'} ${isPulsing ? 'scale-[1.05] ring-4 ring-blue-400 z-20 shadow-[0_0_30px_rgba(59,130,246,0.6)]' : ''} ${layer.locked ? 'cursor-not-allowed' : ''}`}
              style={{
                left: transform.x,
                top: transform.y,
                width: transform.width,
                height: transform.height,
                opacity: transform.opacity,
                transform: `rotate(${transform.rotation}deg)`,
                zIndex: isSelected || isPulsing ? 50 : 0
              }}
            >
              <div className="w-full h-full pointer-events-none select-none">
                {type === LayerType.TEXT ? (
                  <TextLayerRenderer layer={layer} scale={1} />
                ) : type === LayerType.SHAPE ? (
                  <div 
                    className="w-full h-full"
                    style={{ 
                      backgroundColor: (content as any).color || 'blue',
                      borderRadius: (content as any).borderRadius || 0
                    }}
                  />
                ) : type === LayerType.IMAGE ? (
                  <img 
                    src={(content as any).url} 
                    className="w-full h-full"
                    style={{ objectFit: (content as any).fit }}
                    draggable={false}
                    referrerPolicy="no-referrer"
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

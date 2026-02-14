
import React, { useRef, useState, useEffect } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { RESOLUTIONS, LayerType, AspectRatio } from '../../../shared/types';
import { resolveResponsiveLayers } from '../../../services/resolver';
import { TextLayerRenderer } from './TextLayerRenderer';

export const Workspace: React.FC = () => {
  const { currentTemplate, ui, selection, selectLayer, updateLayerTransform } = useStudioStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const activeRes = RESOLUTIONS[ui.activeResolution] || RESOLUTIONS.BROADCAST;
  const canvasWidth = activeRes.width;
  const canvasHeight = activeRes.height;

  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current) return;
      const padding = 80;
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
    selectLayer(layerId);
    const layer = currentTemplate.layers.find(l => l.id === layerId);
    if (!layer) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - (layer.transform.x * scale),
      y: e.clientY - (layer.transform.y * scale)
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selection.selectedLayerId) return;

    updateLayerTransform(selection.selectedLayerId, {
      x: (e.clientX - dragOffset.x) / scale,
      y: (e.clientY - dragOffset.y) / scale
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div 
      ref={containerRef}
      className="flex-1 bg-zinc-950 flex items-center justify-center relative overflow-hidden group select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={() => selectLayer(null)}
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      <div className="absolute top-4 right-4 flex gap-4 items-center">
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
          const isSelected = selection.selectedLayerId === layer.id;
          const isPulsing = ui.lastPulseLayerId === layer.id;
          const { transform, type, content } = layer;

          return (
            <div
              key={layer.id}
              onMouseDown={(e) => handleMouseDown(e, layer.id)}
              className={`absolute cursor-move transition-all duration-300 ${isSelected ? 'ring-2 ring-blue-500 z-10' : 'hover:ring-1 hover:ring-zinc-600'} ${isPulsing ? 'scale-[1.05] ring-4 ring-blue-400 z-20 shadow-[0_0_30px_rgba(59,130,246,0.6)]' : ''}`}
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
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

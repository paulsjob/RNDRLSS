
import React, { useState, useRef } from 'react';
import { useStudioStore } from './store/useStudioStore';
import { AspectRatio, LayerType, RESOLUTIONS } from '../../shared/types';
import { resolveResponsiveLayers } from '../../services/resolver';

export const Canvas: React.FC = () => {
  // Fix: Access ui.activeResolution and selection.selectedLayerId from StudioState
  const { currentTemplate, ui, selection, selectLayer, updateLayerTransform } = useStudioStore();
  const selectedLayerId = selection.selectedLayerId;
  const activeAspectRatio = RESOLUTIONS[ui.activeResolution].ratio;

  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  if (!currentTemplate) return null;

  const resolvedLayers = resolveResponsiveLayers(currentTemplate, activeAspectRatio);

  const handleMouseDown = (e: React.MouseEvent, layerId: string) => {
    e.stopPropagation();
    selectLayer(layerId);
    const layer = currentTemplate.layers.find(l => l.id === layerId);
    if (!layer) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - layer.transform.x,
      y: e.clientY - layer.transform.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedLayerId) return;

    updateLayerTransform(selectedLayerId, {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Determine actual dimensions based on active aspect ratio
  let canvasWidth = 1920;
  let canvasHeight = 1080;

  if (activeAspectRatio === AspectRatio.VERTICAL) {
    canvasWidth = RESOLUTIONS.SOCIAL_VERTICAL.width;
    canvasHeight = RESOLUTIONS.SOCIAL_VERTICAL.height;
  } else if (activeAspectRatio === AspectRatio.SQUARE) {
    canvasWidth = RESOLUTIONS.SOCIAL_SQUARE.width;
    canvasHeight = RESOLUTIONS.SOCIAL_SQUARE.height;
  }

  const containerScale = 0.4;

  return (
    <div 
      className="flex-1 bg-zinc-950 flex items-center justify-center overflow-hidden relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={() => selectLayer(null)}
    >
      <div className="absolute top-4 left-4 text-xs text-zinc-500 font-mono">
        CANVAS: {canvasWidth}x{canvasHeight} | RATIO: {activeAspectRatio}
      </div>

      <div 
        ref={canvasRef}
        className="bg-black shadow-2xl relative border border-zinc-800 overflow-hidden"
        style={{
          width: canvasWidth * containerScale,
          height: canvasHeight * containerScale,
        }}
      >
        {resolvedLayers.map((layer) => {
          if (!layer.visible) return null;
          const isSelected = selectedLayerId === layer.id;
          const { transform, type } = layer;

          return (
            <div
              key={layer.id}
              onMouseDown={(e) => handleMouseDown(e, layer.id)}
              className={`absolute cursor-move transition-shadow ${isSelected ? 'ring-2 ring-blue-500 z-10 shadow-lg' : 'hover:ring-1 hover:ring-zinc-600'}`}
              style={{
                left: transform.x * containerScale,
                top: transform.y * containerScale,
                width: transform.width * containerScale,
                height: transform.height * containerScale,
                opacity: transform.opacity,
                transform: `rotate(${transform.rotation}deg)`,
                zIndex: isSelected ? 50 : 0
              }}
            >
              {type === LayerType.TEXT && (
                <div 
                  style={{ 
                    fontSize: (layer.content.fontSize || 16) * containerScale,
                    color: layer.content.color || 'white',
                    fontWeight: layer.content.fontWeight || 'normal',
                    textAlign: layer.content.textAlign || 'left',
                    fontFamily: layer.content.fontFamily
                  }}
                  className="w-full h-full flex items-center justify-center whitespace-nowrap"
                >
                  {layer.content.text}
                </div>
              )}
              {type === LayerType.SHAPE && (
                <div 
                  className="w-full h-full"
                  style={{ 
                    backgroundColor: layer.content.color || 'blue',
                    borderRadius: (layer.content.borderRadius || 0) * containerScale
                  }}
                />
              )}
              {type === LayerType.IMAGE && (
                <img 
                  src={layer.content.url} 
                  className="w-full h-full"
                  style={{ objectFit: layer.content.fit }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

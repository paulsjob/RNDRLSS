
import React, { useState, useEffect } from 'react';
import { liveService } from '../../services/liveService';
import { useStudioStore } from '../studio/store/useStudioStore';
import { LiveGraphicInstance, LayerType, AspectRatio } from '../../shared/types';
import { resolveTemplateForOutput } from '../../services/resolver';

export const LivePreview: React.FC = () => {
  const { currentTemplate } = useStudioStore();
  const [instance, setInstance] = useState<LiveGraphicInstance | null>(null);

  useEffect(() => {
    const unsubscribe = liveService.subscribe((inst) => setInstance(inst));
    return () => {
      unsubscribe();
    };
  }, []);

  if (!instance || !currentTemplate) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-600 border-2 border-dashed border-zinc-800 rounded-lg m-4">
        <span className="text-4xl">∅</span>
        <p className="mt-2 text-sm">NO GRAPHIC ON AIR</p>
      </div>
    );
  }

  const resolvedLayers = resolveTemplateForOutput(
    currentTemplate, 
    instance.aspectRatio, 
    instance.dataSnapshot
  );

  const canvasWidth = instance.aspectRatio === AspectRatio.WIDE ? 1920 : 1080;
  const canvasHeight = instance.aspectRatio === AspectRatio.WIDE ? 1080 : 1920;
  const previewScale = 0.3;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-black/40">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 bg-red-600 rounded-full">
           <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
           <span className="text-[10px] font-black uppercase tracking-widest text-white">Live Output</span>
        </div>
        <span className="text-xs text-zinc-500 font-mono">{instance.aspectRatio}</span>
      </div>

      <div 
        className="bg-black shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden ring-1 ring-zinc-800"
        style={{
          width: canvasWidth * previewScale,
          height: canvasHeight * previewScale,
        }}
      >
        {resolvedLayers.map(layer => (
          <div
            key={layer.id}
            className="absolute transition-all duration-500 ease-out"
            style={{
              left: layer.transform.x * previewScale,
              top: layer.transform.y * previewScale,
              width: layer.transform.width * previewScale,
              height: layer.transform.height * previewScale,
              opacity: layer.transform.opacity,
            }}
          >
            {layer.type === LayerType.TEXT && (
              <div 
                style={{ 
                  fontSize: (layer.content.fontSize || 16) * previewScale,
                  color: layer.content.color || 'white',
                  fontWeight: layer.content.fontWeight || 'normal'
                }}
                className="w-full h-full flex items-center justify-center"
              >
                {layer.content.text}
              </div>
            )}
            {layer.type === LayerType.SHAPE && (
              <div 
                className="w-full h-full"
                style={{ 
                  backgroundColor: layer.content.color || 'blue',
                  borderRadius: (layer.content.borderRadius || 0) * previewScale
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};


import React, { useMemo } from 'react';
import { Layer, LayerType } from '../../../shared/types';
import { useLiveValue } from '../../../shared/data-runtime/hooks';
import { applyTransforms } from '../../../contract/transforms';
import { useStudioStore } from '../store/useStudioStore';

/**
 * Resolver function to determine the final display string for a text layer.
 * prioritized bound live data, fallback to static text.
 */
export const getDisplayText = (layer: Layer, liveValue?: any, transform: string = 'none'): string => {
  if (layer.type !== LayerType.TEXT) return '';
  
  if (liveValue !== undefined && liveValue !== null) {
    const transforms = transform === 'none' ? [] : [transform];
    return String(applyTransforms(liveValue, transforms));
  }
  
  return layer.content.text || '';
};

interface TextLayerRendererProps {
  layer: Layer;
  scale: number;
}

/**
 * High-performance stage renderer for text layers.
 * Subscribes only to its own bound data to avoid global stage re-renders.
 */
export const TextLayerRenderer: React.FC<TextLayerRendererProps> = ({ layer, scale }) => {
  const bindings = useStudioStore(s => s.currentTemplate?.bindings || {});
  
  // Resolve binding info for this specific layer
  const bindingKey = `${layer.id}.text`;
  const bindingValue = bindings[bindingKey] || '';
  const [keyId, transform] = bindingValue.includes('|') ? bindingValue.split('|') : [bindingValue, 'none'];

  // Subscribe only if bound
  const record = useLiveValue(keyId || null);
  
  const displayValue = useMemo(() => {
    return getDisplayText(layer, record?.value, transform);
  }, [layer, record?.value, transform]);

  if (layer.type !== LayerType.TEXT) return null;

  return (
    <div 
      style={{ 
        fontSize: (layer.content.fontSize || 16) * scale,
        color: layer.content.color || 'white',
        fontWeight: layer.content.fontWeight || 'normal',
        textAlign: layer.content.textAlign || 'left',
        fontFamily: layer.content.fontFamily
      }}
      className="w-full h-full flex items-center justify-center whitespace-nowrap overflow-hidden"
    >
      {displayValue}
    </div>
  );
};

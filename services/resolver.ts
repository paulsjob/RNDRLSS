
import { GraphicTemplate, Layer, AspectRatio, ResponsiveOverride, RESOLUTIONS } from '../shared/types';

export const resolveResponsiveLayers = (template: GraphicTemplate, targetRatio: AspectRatio): Layer[] => {
  const overrides: ResponsiveOverride[] = template.overrides[targetRatio] || [];

  return template.layers.map(layer => {
    const layerOverrides = overrides.filter(o => o.layerId === layer.id);
    if (layerOverrides.length === 0) return layer;

    const resolvedLayer = JSON.parse(JSON.stringify(layer)); // Deep copy

    layerOverrides.forEach(override => {
      const { property, value } = override;
      if (property in resolvedLayer.transform) {
        (resolvedLayer.transform as any)[property] = value;
      } else {
        (resolvedLayer.content as any)[property] = value;
      }
    });

    return resolvedLayer;
  });
};

export const applyDataBindings = (layers: Layer[], bindings: GraphicTemplate['bindings'], data: Record<string, any>): Layer[] => {
  // bindings is mapping: "layerId.property" -> "dictionaryItemId"
  // For demo, we assume data keys match dictionaryItem IDs
  return layers.map(layer => {
    const boundLayer = JSON.parse(JSON.stringify(layer));
    
    Object.entries(bindings).forEach(([key, dictId]) => {
      const [layerId, property] = key.split('.');
      if (layerId === layer.id) {
        // Resolve value from snapshot using dictionary mapping
        // In real app, you'd lookup dictionaryItem by dictId to get providerPath
        const value = data[dictId];
        
        if (value !== undefined) {
          (boundLayer.content as any)[property] = value;
        }
      }
    });

    return boundLayer;
  });
};

export const resolveTemplateForOutput = (
  template: GraphicTemplate, 
  ratio: AspectRatio, 
  data: Record<string, any>
): Layer[] => {
  const responsiveLayers = resolveResponsiveLayers(template, ratio);
  return applyDataBindings(responsiveLayers, template.bindings, data);
};

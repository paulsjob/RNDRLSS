
import { create } from 'zustand';
import { Template, Layer, AspectRatio, LayerType, LogicLayer } from '../types';

interface StudioState {
  currentTemplate: Template | null;
  selectedLayerId: string | null;
  activeAspectRatio: AspectRatio;
  
  // Actions
  setTemplate: (template: Template) => void;
  selectLayer: (id: string | null) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  updateTemplateMetadata: (meta: Partial<Template['metadata']>) => void;
  updateLayerTransform: (layerId: string, transform: Partial<Layer['transform']>) => void;
  updateLayerContent: (layerId: string, content: Partial<Layer['content']>) => void;
  addLayer: (type: LayerType) => void;
  removeLayer: (id: string) => void;
  setBinding: (layerId: string, property: string, dataPath: string) => void;
}

const INITIAL_TEMPLATE: Template = {
  id: 'tmpl-001',
  version: '1.0.0',
  metadata: {
    name: 'NFL Game Scorebug',
    tags: ['nfl', 'scorebug', 'live'],
    baseAspectRatio: AspectRatio.WIDE,
    logicLayer: LogicLayer.BUG
  },
  layers: [
    {
      id: 'layer-bg',
      type: LayerType.SHAPE,
      name: 'Background Bar',
      transform: { x: 40, y: 40, width: 400, height: 60, opacity: 0.9 },
      content: { color: '#18181b', borderRadius: 8 }
    },
    {
      id: 'layer-home-team',
      type: LayerType.TEXT,
      name: 'Home Team',
      transform: { x: 60, y: 55, width: 100, height: 30, opacity: 1 },
      content: { text: 'SEA', fontSize: 24, fontWeight: 'bold', color: '#ffffff' }
    }
  ],
  bindings: {
    'layer-home-team.text': { dataPath: 'game.home.abbr', transform: 'uppercase' }
  },
  responsiveOverrides: {
    vertical: [
      { layerId: 'layer-bg', property: 'width', value: 300 },
      { layerId: 'layer-bg', property: 'x', value: 20 }
    ],
    square: []
  }
};

export const useStudioStore = create<StudioState>((set) => ({
  currentTemplate: INITIAL_TEMPLATE,
  selectedLayerId: null,
  activeAspectRatio: AspectRatio.WIDE,

  setTemplate: (template) => set({ currentTemplate: template }),
  selectLayer: (id) => set({ selectedLayerId: id }),
  setAspectRatio: (ratio) => set({ activeAspectRatio: ratio }),

  updateTemplateMetadata: (meta) => set((state) => ({
    currentTemplate: state.currentTemplate ? {
      ...state.currentTemplate,
      metadata: { ...state.currentTemplate.metadata, ...meta }
    } : null
  })),

  updateLayerTransform: (layerId, transform) => set((state) => {
    if (!state.currentTemplate) return state;
    return {
      currentTemplate: {
        ...state.currentTemplate,
        layers: state.currentTemplate.layers.map((l) =>
          l.id === layerId ? { ...l, transform: { ...l.transform, ...transform } } : l
        )
      }
    };
  }),

  updateLayerContent: (layerId, content) => set((state) => {
    if (!state.currentTemplate) return state;
    return {
      currentTemplate: {
        ...state.currentTemplate,
        layers: state.currentTemplate.layers.map((l) =>
          l.id === layerId ? { ...l, content: { ...l.content, ...content } } : l
        )
      }
    };
  }),

  addLayer: (type) => set((state) => {
    if (!state.currentTemplate) return state;
    const newLayer: Layer = {
      id: `layer-${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: `New ${type}`,
      transform: { x: 100, y: 100, width: 150, height: 50, opacity: 1 },
      content: type === LayerType.TEXT ? { text: 'New Text', fontSize: 24, color: '#ffffff' } : { color: '#3b82f6', borderRadius: 0 }
    };
    return {
      currentTemplate: {
        ...state.currentTemplate,
        layers: [...state.currentTemplate.layers, newLayer]
      }
    };
  }),

  removeLayer: (id) => set((state) => {
    if (!state.currentTemplate) return state;
    return {
      currentTemplate: {
        ...state.currentTemplate,
        layers: state.currentTemplate.layers.filter((l) => l.id !== id)
      }
    };
  }),

  setBinding: (layerId, property, dataPath) => set((state) => {
    if (!state.currentTemplate) return state;
    const newBindings = { ...state.currentTemplate.bindings };
    if (!dataPath) {
      delete newBindings[`${layerId}.${property}`];
    } else {
      newBindings[`${layerId}.${property}`] = { dataPath };
    }
    return {
      currentTemplate: { ...state.currentTemplate, bindings: newBindings }
    };
  })
}));

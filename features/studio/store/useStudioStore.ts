
import { create } from 'zustand';
import { 
  GraphicTemplate, 
  Layer, 
  AspectRatio, 
  LayerType, 
  LogicLayer, 
  RESOLUTIONS 
} from '../../../shared/types';

interface StudioState {
  // Template Data
  currentTemplate: GraphicTemplate | null;
  
  // UI & Selection State
  ui: {
    leftPanelOpen: boolean;
    rightPanelOpen: boolean;
    zoomLevel: number;
    activeResolution: keyof typeof RESOLUTIONS;
  };
  selection: {
    selectedLayerId: string | null;
  };
  
  // Actions
  setTemplate: (template: GraphicTemplate) => void;
  selectLayer: (id: string | null) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  togglePanel: (panel: 'left' | 'right') => void;
  setZoom: (zoom: number) => void;
  setResolution: (res: keyof typeof RESOLUTIONS) => void;
  
  // Template Actions
  updateTemplateMetadata: (meta: Partial<GraphicTemplate['metadata']>) => void;
  updateLayerTransform: (layerId: string, transform: Partial<Layer['transform']>) => void;
  updateLayerContent: (layerId: string, content: Partial<any>) => void;
  addLayer: (type: LayerType) => void;
  removeLayer: (id: string) => void;
  setBinding: (layerId: string, property: string, dictionaryItemId: string | null) => void;
}

const INITIAL_TEMPLATE: GraphicTemplate = {
  id: 'tmpl-001',
  version: '1.0.0',
  metadata: {
    name: 'NFL Game Scorebug',
    tags: ['nfl', 'scorebug', 'live'],
    baseResolution: 'BROADCAST',
    logicLayer: LogicLayer.BUG
  },
  layers: [
    {
      id: 'layer-bg',
      type: LayerType.SHAPE,
      name: 'Background Bar',
      visible: true,
      locked: false,
      transform: { x: 40, y: 40, width: 400, height: 60, opacity: 0.9, rotation: 0 },
      content: { color: '#18181b', borderRadius: 8 }
    },
    {
      id: 'layer-home-team',
      type: LayerType.TEXT,
      name: 'Home Team',
      visible: true,
      locked: false,
      transform: { x: 60, y: 55, width: 100, height: 30, opacity: 1, rotation: 0 },
      content: { 
        text: 'SEA', 
        fontSize: 24, 
        fontWeight: 'bold', 
        color: '#ffffff', 
        fontFamily: 'Inter',
        textAlign: 'center' 
      }
    }
  ],
  bindings: {
    'layer-home-team.text': 'dict-sea-abbr'
  },
  overrides: {
    [AspectRatio.WIDE]: [],
    [AspectRatio.VERTICAL]: [
      { layerId: 'layer-bg', property: 'width', value: 300 },
      { layerId: 'layer-bg', property: 'x', value: 20 }
    ],
    [AspectRatio.SQUARE]: []
  }
};

export const useStudioStore = create<StudioState>((set) => ({
  currentTemplate: INITIAL_TEMPLATE,
  ui: {
    leftPanelOpen: true,
    rightPanelOpen: true,
    zoomLevel: 1,
    activeResolution: 'BROADCAST',
  },
  selection: {
    selectedLayerId: null,
  },

  setTemplate: (template) => set({ currentTemplate: template }),
  selectLayer: (id) => set((state) => ({ 
    selection: { ...state.selection, selectedLayerId: id } 
  })),
  
  setAspectRatio: (ratio) => set((state) => {
    // Find matching resolution key for the aspect ratio
    const resKey = Object.entries(RESOLUTIONS).find(([_, v]) => v.ratio === ratio)?.[0] as keyof typeof RESOLUTIONS;
    return {
      ui: { ...state.ui, activeResolution: resKey || 'BROADCAST' }
    };
  }),

  togglePanel: (panel) => set((state) => ({
    ui: {
      ...state.ui,
      [panel === 'left' ? 'leftPanelOpen' : 'rightPanelOpen']: !state.ui[panel === 'left' ? 'leftPanelOpen' : 'rightPanelOpen']
    }
  })),

  setZoom: (zoom) => set((state) => ({
    ui: { ...state.ui, zoomLevel: zoom }
  })),

  setResolution: (res) => set((state) => ({
    ui: { ...state.ui, activeResolution: res }
  })),

  updateTemplateMetadata: (meta) => set((state) => ({
    currentTemplate: state.currentTemplate ? {
      ...state.currentTemplate,
      metadata: { ...state.currentTemplate.metadata, ...meta }
    } : null
  })),

  updateLayerTransform: (layerId, transform) => set((state) => {
    if (!state.currentTemplate) return state;
    // Fix: Using a type assertion for the mapped array prevents TypeScript from widening the union incorrectly.
    return {
      currentTemplate: {
        ...state.currentTemplate,
        layers: state.currentTemplate.layers.map((l) =>
          l.id === layerId ? { ...l, transform: { ...l.transform, ...transform } } : l
        ) as Layer[]
      }
    };
  }),

  updateLayerContent: (layerId, content) => set((state) => {
    if (!state.currentTemplate) return state;
    // Fix: Using a type assertion for the mapped array prevents TypeScript from widening the union incorrectly.
    return {
      currentTemplate: {
        ...state.currentTemplate,
        layers: state.currentTemplate.layers.map((l) =>
          l.id === layerId ? { ...l, content: { ...l.content, ...content } } : l
        ) as Layer[]
      }
    };
  }),

  addLayer: (type) => set((state) => {
    if (!state.currentTemplate) return state;
    const id = `layer-${Math.random().toString(36).substr(2, 9)}`;
    
    const base = {
      id,
      name: `New ${type}`,
      visible: true,
      locked: false,
      transform: { x: 100, y: 100, width: 150, height: 50, opacity: 1, rotation: 0 },
    };

    let newLayer: Layer;
    if (type === LayerType.TEXT) {
      newLayer = {
        ...base,
        type: LayerType.TEXT,
        content: { 
          text: 'New Text', 
          fontSize: 24, 
          color: '#ffffff', 
          fontFamily: 'Inter', 
          fontWeight: 'normal', 
          textAlign: 'left' 
        }
      };
    } else if (type === LayerType.SHAPE) {
      newLayer = {
        ...base,
        type: LayerType.SHAPE,
        content: { 
          color: '#3b82f6', 
          borderRadius: 0 
        }
      };
    } else {
      return state;
    }

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

  setBinding: (layerId, property, dictionaryItemId) => set((state) => {
    if (!state.currentTemplate) return state;
    const newBindings = { ...state.currentTemplate.bindings };
    const key = `${layerId}.${property}`;
    if (!dictionaryItemId) {
      delete newBindings[key];
    } else {
      newBindings[key] = dictionaryItemId;
    }
    return {
      currentTemplate: { ...state.currentTemplate, bindings: newBindings }
    };
  })
}));


import { create } from 'zustand';
import { 
  Connection, 
  Edge, 
  EdgeChange, 
  Node, 
  NodeChange, 
  OnConnect, 
  OnEdgesChange, 
  OnNodesChange, 
  applyEdgeChanges, 
  applyNodeChanges, 
  addEdge 
} from 'reactflow';
import { DataAdapter } from '../../../shared/types';
import { Dictionary, MappingSpec } from '../../../contract/types';
import { SportsAdapter } from '../../../services/data/adapters/SportsAdapter';
import { FinanceAdapter } from '../../../services/data/adapters/FinanceAdapter';
import { WeatherAdapter } from '../../../services/data/adapters/WeatherAdapter';
import { MLB_CANON_DICTIONARY } from '../../../contract/dictionaries/mlb';
import { liveBus } from '../../../shared/data-runtime';

const ADAPTERS: DataAdapter[] = [
  new SportsAdapter(),
  new FinanceAdapter(),
  new WeatherAdapter()
];

export type ValidationStatus = 'idle' | 'validating' | 'pass' | 'fail';
export type DeploymentStatus = 'idle' | 'deploying' | 'success';

interface ImportResult {
  importedCount: number;
  skippedCount: number;
  conflicts: string[];
}

interface DataState {
  orgId: string;
  availableAdapters: DataAdapter[];
  activeAdapterId: string;
  liveSnapshot: Record<string, any>;
  
  // Dictionaries
  builtinDictionaries: Dictionary[];
  importedDictionaries: Dictionary[];
  mappings: MappingSpec[];
  
  isLoading: boolean;
  
  // React Flow State
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Node) => void;

  // Validation & Deployment
  validation: {
    status: ValidationStatus;
    errors: string[];
    lastValidated: number;
  };
  deployment: {
    status: DeploymentStatus;
    endpointUrl: string | null;
  };

  // Actions
  setOrgId: (id: string) => void;
  setActiveAdapter: (id: string) => Promise<void>;
  refreshSnapshot: () => Promise<void>;
  validateGraph: () => void;
  deployEndpoint: () => void;
  resetDeployment: () => void;
  
  // Persistence
  saveToOrg: () => void;
  loadFromOrg: (id: string) => void;
  importBundleData: (data: { dictionaries: Dictionary[], mappings: MappingSpec[], graphs: any[] }) => ImportResult;
}

export const useDataStore = create<DataState>((set, get) => ({
  orgId: 'org_default',
  availableAdapters: ADAPTERS,
  activeAdapterId: ADAPTERS[0].id,
  liveSnapshot: {},
  
  builtinDictionaries: [MLB_CANON_DICTIONARY as unknown as Dictionary],
  importedDictionaries: [],
  mappings: [],
  
  isLoading: false,
  nodes: [],
  edges: [],

  validation: {
    status: 'idle',
    errors: [],
    lastValidated: 0,
  },
  deployment: {
    status: 'idle',
    endpointUrl: null,
  },

  onNodesChange: (changes: NodeChange[]) => {
    set({ 
      nodes: applyNodeChanges(changes, get().nodes),
      validation: { ...get().validation, status: 'idle' } // Reset validation on change
    });
    get().saveToOrg();
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({ 
      edges: applyEdgeChanges(changes, get().edges),
      validation: { ...get().validation, status: 'idle' }
    });
    get().saveToOrg();
  },
  onConnect: (connection: Connection) => {
    set({ 
      edges: addEdge({ ...connection, animated: true }, get().edges),
      validation: { ...get().validation, status: 'idle' }
    });
    get().saveToOrg();
  },
  addNode: (node: Node) => {
    set({ 
      nodes: [...get().nodes, node],
      validation: { ...get().validation, status: 'idle' }
    });
    get().saveToOrg();
  },

  validateGraph: () => {
    set({ validation: { ...get().validation, status: 'validating', errors: [] } });
    
    // Simulate thinking/scanning
    setTimeout(() => {
      const { nodes, edges } = get();
      const errors: string[] = [];

      if (nodes.length === 0) {
        errors.push("Graph is empty. Add nodes to define logic.");
      } else {
        // 1. Check for orphaned nodes (no connections)
        nodes.forEach(node => {
          const hasConnection = edges.some(edge => edge.source === node.id || edge.target === node.id);
          if (!hasConnection) {
            errors.push(`Orphaned Node: "${node.data.label}" has no logic paths.`);
          }
          if (!node.data.keyId) {
            errors.push(`Invalid Node: "${node.id}" is missing a KeyId reference.`);
          }
        });
      }

      set({ 
        validation: { 
          status: errors.length > 0 ? 'fail' : 'pass', 
          errors,
          lastValidated: Date.now()
        } 
      });
    }, 1200);
  },

  deployEndpoint: () => {
    const { validation } = get();
    if (validation.status !== 'pass') return;

    set({ deployment: { status: 'deploying', endpointUrl: null } });

    // Simulate cluster provisioning
    setTimeout(() => {
      const mockUrl = `https://api.renderless.io/v1/edge/${get().orgId}/live.json`;
      set({ 
        deployment: { 
          status: 'success', 
          endpointUrl: mockUrl 
        } 
      });
    }, 2500);
  },

  resetDeployment: () => {
    set({ deployment: { status: 'idle', endpointUrl: null } });
  },

  setOrgId: (id) => {
    set({ orgId: id });
    get().loadFromOrg(id);
  },

  setActiveAdapter: async (id) => {
    const adapter = ADAPTERS.find(a => a.id === id);
    if (!adapter) return;
    set({ activeAdapterId: id, isLoading: true });
    const snapshot = await adapter.fetchLive();
    set({ liveSnapshot: snapshot, isLoading: false });
  },

  refreshSnapshot: async () => {
    const { activeAdapterId } = get();
    const adapter = ADAPTERS.find(a => a.id === activeAdapterId);
    if (!adapter) return;
    const snapshot = await adapter.fetchLive();
    set({ liveSnapshot: snapshot });
  },

  saveToOrg: () => {
    const { orgId, importedDictionaries, mappings, nodes, edges } = get();
    localStorage.setItem(`renderless:${orgId}:dataEngine:dictionaries`, JSON.stringify(importedDictionaries));
    localStorage.setItem(`renderless:${orgId}:dataEngine:mappings`, JSON.stringify(mappings));
    localStorage.setItem(`renderless:${orgId}:dataEngine:graphs`, JSON.stringify({ nodes, edges }));
  },

  loadFromOrg: (id) => {
    const dictsRaw = localStorage.getItem(`renderless:${id}:dataEngine:dictionaries`);
    const mapsRaw = localStorage.getItem(`renderless:${id}:dataEngine:mappings`);
    const graphsRaw = localStorage.getItem(`renderless:${id}:dataEngine:graphs`);

    set({
      importedDictionaries: dictsRaw ? JSON.parse(dictsRaw) : [],
      mappings: mapsRaw ? JSON.parse(mapsRaw) : [],
      nodes: graphsRaw ? JSON.parse(graphsRaw).nodes || [] : [],
      edges: graphsRaw ? JSON.parse(graphsRaw).edges || [] : []
    });
  },

  importBundleData: ({ dictionaries, mappings, graphs }) => {
    const { importedDictionaries: currentDicts, mappings: currentMaps } = get();
    
    let importedCount = 0;
    let skippedCount = 0;
    const conflicts: string[] = [];

    // Import Dictionaries
    const nextDicts = [...currentDicts];
    dictionaries.forEach(dict => {
      // Skip builtin
      if (get().builtinDictionaries.some(bd => bd.dictionaryId === dict.dictionaryId)) {
        skippedCount++;
        conflicts.push(`Dictionary [Built-in]: ${dict.dictionaryId}`);
        return;
      }

      const existingIdx = nextDicts.findIndex(d => d.dictionaryId === dict.dictionaryId && d.version === dict.version);
      if (existingIdx === -1) {
        nextDicts.push(dict);
        importedCount++;
      } else {
        skippedCount++;
        conflicts.push(`Dictionary [Exists]: ${dict.dictionaryId} v${dict.version}`);
      }
    });

    // Import Mappings
    const nextMaps = [...currentMaps];
    mappings.forEach(map => {
      const existingIdx = nextMaps.findIndex(m => m.mappingId === map.mappingId);
      if (existingIdx === -1) {
        nextMaps.push(map);
        importedCount++;
      } else {
        skippedCount++;
        conflicts.push(`Mapping [Exists]: ${map.mappingId}`);
      }
    });

    set({ 
      importedDictionaries: nextDicts,
      mappings: nextMaps,
      nodes: graphs[0]?.nodes || get().nodes,
      edges: graphs[0]?.edges || get().edges
    });

    get().saveToOrg();
    
    return { importedCount, skippedCount, conflicts };
  }
}));

// Initialize LiveBus Sync for Graph
liveBus.subscribeAll((msg) => {
  const store = useDataStore.getState();
  const { nodes, edges } = store;
  if (!nodes.length) return;

  // Extract changed keys
  let changedKeys: string[] = [];
  if (msg.type === 'snapshot') {
    changedKeys = Object.keys(msg.values);
  } else if (msg.type === 'delta') {
    changedKeys = msg.changes.map(c => c.keyId);
  } else if (msg.type === 'event') {
    changedKeys = [msg.eventKeyId];
  }

  const updatedNodes = [...nodes];
  const updatedEdges = [...edges];
  let hasChanges = false;

  changedKeys.forEach(keyId => {
    const record = liveBus.getValue(keyId);
    if (!record) return;

    // Find nodes associated with this key
    updatedNodes.forEach((node, idx) => {
      if (node.data.keyId === keyId) {
        hasChanges = true;
        updatedNodes[idx] = {
          ...node,
          data: {
            ...node.data,
            value: record.value,
            lastUpdated: Date.now()
          }
        };

        // Trigger edge animations for outgoing connections
        updatedEdges.forEach((edge, eIdx) => {
          if (edge.source === node.id) {
            updatedEdges[eIdx] = { ...edge, animated: true };
          }
        });
      }
    });
  });

  if (hasChanges) {
    useDataStore.setState({ nodes: updatedNodes, edges: updatedEdges });
    
    // Throttled reset of edge animations to keep things clean but responsive
    setTimeout(() => {
      const currentNodes = useDataStore.getState().nodes;
      const currentEdges = useDataStore.getState().edges;
      const cleanedEdges = currentEdges.map(e => ({ ...e, animated: false }));
      useDataStore.setState({ edges: cleanedEdges });
    }, 1000);
  }
});

// Initial load
setTimeout(() => {
  useDataStore.getState().loadFromOrg('org_default');
}, 0);

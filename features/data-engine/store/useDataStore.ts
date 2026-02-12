
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
import { DataAdapter, DictionaryItem } from '../../../shared/types';
import { SportsAdapter } from '../../../services/data/adapters/SportsAdapter';
import { FinanceAdapter } from '../../../services/data/adapters/FinanceAdapter';
import { WeatherAdapter } from '../../../services/data/adapters/WeatherAdapter';

const ADAPTERS: DataAdapter[] = [
  new SportsAdapter(),
  new FinanceAdapter(),
  new WeatherAdapter()
];

// Fix: Added React Flow specific state and handlers to DataState interface to satisfy NodeCanvas.tsx destructuring
interface DataState {
  availableAdapters: DataAdapter[];
  activeAdapterId: string;
  liveSnapshot: Record<string, any>;
  dictionary: DictionaryItem[];
  isLoading: boolean;
  
  // React Flow State
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: Node) => void;

  // Actions
  setActiveAdapter: (id: string) => Promise<void>;
  refreshSnapshot: () => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  availableAdapters: ADAPTERS,
  activeAdapterId: ADAPTERS[0].id,
  liveSnapshot: {},
  dictionary: ADAPTERS[0].getDictionary(),
  isLoading: false,

  // Fix: Initialize nodes and edges arrays and implement state management logic for React Flow
  nodes: [],
  edges: [],

  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection: Connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },
  addNode: (node: Node) => {
    set({
      nodes: [...get().nodes, node]
    });
  },

  setActiveAdapter: async (id) => {
    const adapter = ADAPTERS.find(a => a.id === id);
    if (!adapter) return;
    
    set({ activeAdapterId: id, isLoading: true, dictionary: adapter.getDictionary() });
    const snapshot = await adapter.fetchLive();
    set({ liveSnapshot: snapshot, isLoading: false });
  },

  refreshSnapshot: async () => {
    const { activeAdapterId } = get();
    const adapter = ADAPTERS.find(a => a.id === activeAdapterId);
    if (!adapter) return;
    
    const snapshot = await adapter.fetchLive();
    set({ liveSnapshot: snapshot });
  }
}));

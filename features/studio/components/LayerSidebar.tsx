
import React, { useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { useAssetStore } from '../store/useAssetStore';
import { LayerType } from '../../../shared/types';
import { Button } from '../../../shared/components/Button';
import { 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Trash2, 
  Plus,
  Layers,
  Image as ImageIcon,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const LayerSidebar: React.FC = () => {
  const { 
    currentTemplate, 
    selection, 
    selectLayer, 
    addLayer, 
    removeLayer, 
    moveLayer, 
    toggleLayerVisibility, 
    toggleLayerLock,
    addAssetLayer
  } = useStudioStore();
  const { assets, uploadAsset } = useAssetStore();
  const [activeTab, setActiveTab] = useState<'layers' | 'assets'>('layers');
  const [assetSearch, setAssetSearch] = useState('');

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAsset(file);
    }
  };

  if (!currentTemplate) return null;

  const filteredAssets = assets.filter(a => 
    a.type !== 'folder' && 
    a.name.toLowerCase().includes(assetSearch.toLowerCase())
  );

  return (
    <div className="w-[280px] h-full bg-zinc-900 border-r border-zinc-800 flex flex-col shadow-2xl z-20">
      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-800 bg-zinc-900/50">
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'layers' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Layers size={12} />
          Layers
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'assets' ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <ImageIcon size={12} />
          Assets
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <AnimatePresence mode="wait">
          {activeTab === 'layers' ? (
            <motion.div
              key="layers"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="h-10 shrink-0 flex items-center justify-between px-4 bg-zinc-900/30 border-b border-zinc-800/50">
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Comp Stack</span>
                <div className="flex gap-1">
                  <button onClick={() => addLayer(LayerType.TEXT)} className="p-1 hover:text-blue-400 text-zinc-500 transition-colors" title="Add Text"><Plus size={14} /></button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
                {[...currentTemplate.layers].reverse().map((layer, index, array) => {
                  const isSelected = selection.selectedLayerIds.includes(layer.id);
                  const actualIndex = array.length - 1 - index;
                  
                  return (
                    <div
                      key={layer.id}
                      onClick={(e) => selectLayer(layer.id, e.ctrlKey || e.metaKey, e.shiftKey)}
                      className={`
                        group flex flex-col p-1 rounded-xl cursor-pointer transition-all border
                        ${isSelected 
                          ? 'bg-blue-600/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                          : 'hover:bg-zinc-800/40 border-transparent'}
                      `}
                    >
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-6 h-6 flex items-center justify-center text-[10px] rounded-lg font-black transition-colors ${isSelected ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700'}`}>
                            {layer.type === LayerType.TEXT ? 'T' : layer.type === LayerType.IMAGE ? 'IMG' : 'S'}
                          </div>
                          <span className={`truncate text-[11px] font-bold tracking-tight ${isSelected ? 'text-blue-400' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                            {layer.name}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'up'); }}
                            disabled={actualIndex === currentTemplate.layers.length - 1}
                            className="p-1 text-zinc-600 hover:text-zinc-300 disabled:opacity-20"
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 'down'); }}
                            disabled={actualIndex === 0}
                            className="p-1 text-zinc-600 hover:text-zinc-300 disabled:opacity-20"
                          >
                            <ChevronDown size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Layer Controls Row */}
                      <div className={`flex items-center justify-between px-2 py-1 mt-0.5 border-t border-zinc-800/50 transition-all ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(layer.id); }}
                            className={`p-1 transition-colors ${layer.visible ? 'text-zinc-500 hover:text-zinc-300' : 'text-blue-500'}`}
                          >
                            {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleLayerLock(layer.id); }}
                            className={`p-1 transition-colors ${layer.locked ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                            {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                          </button>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                          className="p-1 text-zinc-600 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="assets"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="p-3 border-b border-zinc-800 bg-zinc-900/30">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" size={12} />
                  <input
                    type="text"
                    placeholder="Search assets..."
                    value={assetSearch}
                    onChange={(e) => setAssetSearch(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-zinc-300 outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-zinc-800">
                <div className="grid grid-cols-2 gap-2">
                  {filteredAssets.map(asset => (
                    <div
                      key={asset.id}
                      onClick={() => addAssetLayer(asset)}
                      className="group relative aspect-square bg-black border border-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:border-blue-500/50 transition-all"
                    >
                      {asset.type === 'image' ? (
                        <img 
                          src={asset.url} 
                          alt={asset.name} 
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700 group-hover:text-blue-500 transition-colors">
                          <ImageIcon size={24} />
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-1.5 bg-black/80 backdrop-blur-sm translate-y-full group-hover:translate-y-0 transition-transform">
                        <p className="text-[8px] font-black text-white truncate uppercase tracking-tighter">{asset.name}</p>
                      </div>
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-blue-600 rounded-full p-1 shadow-lg">
                          <Plus size={10} className="text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {filteredAssets.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800/30 border border-zinc-800 flex items-center justify-center mb-4">
                      <Search size={20} className="text-zinc-700" />
                    </div>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">No assets found</p>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-zinc-800 bg-zinc-900/50">
                <label className="w-full">
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleUpload}
                    accept="image/*,video/*,audio/*"
                  />
                  <div className="w-full flex items-center justify-center py-2 px-4 rounded-lg border border-zinc-800 hover:bg-zinc-800 text-[10px] font-black uppercase tracking-widest gap-2 cursor-pointer transition-colors">
                    <Plus size={12} />
                    Upload Asset
                  </div>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

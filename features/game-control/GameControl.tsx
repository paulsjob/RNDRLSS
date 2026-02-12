
import React from 'react';
import { useStudioStore } from '../studio/store/useStudioStore';
import { liveService, MOCK_DATA_DICTIONARY } from '../../services/liveService';
import { AspectRatio } from '../../shared/types';
import { Button } from '../../shared/components/Button';

export const GameControl: React.FC = () => {
  const { currentTemplate } = useStudioStore();

  const handleTake = (ratio: AspectRatio) => {
    if (currentTemplate) {
      liveService.take(currentTemplate, ratio);
    }
  };

  const handleClear = () => {
    liveService.clear();
  };

  return (
    <div className="flex-1 bg-zinc-900 p-8 flex flex-col gap-8 overflow-y-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Game Control</h1>
          <p className="text-zinc-500 text-sm">Control live broadcast and social feeds</p>
        </div>
        <div className="flex gap-2">
           <Button variant="danger" size="lg" onClick={handleClear}>CLEAR ALL</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">Active Template</span>
              <h3 className="text-xl font-bold mt-1">{currentTemplate?.metadata.name}</h3>
            </div>
          </div>
          <div className="space-y-3 mt-4">
            <Button className="w-full justify-between" onClick={() => handleTake(AspectRatio.WIDE)}>
              <span>Take Live (16:9)</span>
            </Button>
            <Button variant="secondary" className="w-full justify-between" onClick={() => handleTake(AspectRatio.VERTICAL)}>
              <span>Push to Social (9:16)</span>
            </Button>
          </div>
        </div>

        <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-6 flex flex-col">
          <h4 className="text-sm font-semibold text-zinc-400 mb-4">Live Data Snapshot</h4>
          <div className="space-y-2 text-xs font-mono">
            {Object.entries(MOCK_DATA_DICTIONARY.game).filter(([k]) => typeof MOCK_DATA_DICTIONARY.game[k as keyof typeof MOCK_DATA_DICTIONARY.game] !== 'object').map(([k, v]) => (
              <div key={k} className="flex justify-between p-2 bg-black/20 rounded">
                <span className="text-zinc-500">{k}</span>
                <span className="text-zinc-100">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

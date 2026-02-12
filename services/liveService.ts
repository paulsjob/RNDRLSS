
import { GraphicTemplate, LiveGraphicInstance, AspectRatio } from '../shared/types';

export const MOCK_DATA_DICTIONARY = {
  game: {
    id: 'g-778',
    home: { name: 'Seattle Seahawks', abbr: 'SEA', score: 24 },
    away: { name: 'San Francisco 49ers', abbr: 'SF', score: 21 },
    clock: 'Q4 02:45',
    venue: 'Lumen Field'
  },
  sponsorship: {
    active: 'aws',
    logo: 'https://logo.clearbit.com/aws.amazon.com'
  }
};

type LiveCallback = (instance: LiveGraphicInstance | null) => void;
let currentOnAirInstance: LiveGraphicInstance | null = null;
const subscribers: Set<LiveCallback> = new Set();

export const liveService = {
  subscribe: (cb: LiveCallback) => {
    subscribers.add(cb);
    cb(currentOnAirInstance);
    return () => {
      subscribers.delete(cb);
    };
  },

  take: (template: GraphicTemplate, ratio: AspectRatio) => {
    const instance: LiveGraphicInstance = {
      id: `live-${Date.now()}`,
      templateId: template.id,
      logicLayer: template.metadata.logicLayer,
      dataSnapshot: MOCK_DATA_DICTIONARY,
      onAir: true,
      aspectRatio: ratio,
      timestamp: Date.now()
    };

    currentOnAirInstance = instance;
    subscribers.forEach(cb => cb(instance));
  },

  clear: () => {
    currentOnAirInstance = null;
    subscribers.forEach(cb => cb(null));
  }
};

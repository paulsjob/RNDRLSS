
import { DataAdapter, DictionaryItem } from '../../../shared/types';

export class FinanceAdapter implements DataAdapter {
  id = 'finance-v1';
  name = 'Market Pulse';
  description = 'Direct integration with NYSE and Nasdaq real-time indices.';

  getDictionary(): DictionaryItem[] {
    return [
      { id: 'f-ticker', key: 'Symbol', category: 'Market > Active Ticker', providerPath: 'active.ticker', dataType: 'string' },
      { id: 'f-price', key: 'Last Price', category: 'Market > Active Ticker', providerPath: 'active.price', dataType: 'number' },
      { id: 'f-change', key: '24h Change', category: 'Market > Active Ticker', providerPath: 'active.changePct', dataType: 'percentage' },
      { id: 'f-volume', key: 'Volume', category: 'Market > Active Ticker', providerPath: 'active.volume', dataType: 'number' },
      { id: 'f-index-name', key: 'Index Name', category: 'Macro > Global Indices', providerPath: 'indices[0].name', dataType: 'string' },
      { id: 'f-index-val', key: 'Index Value', category: 'Macro > Global Indices', providerPath: 'indices[0].value', dataType: 'number' }
    ];
  }

  async fetchLive(): Promise<Record<string, any>> {
    return {
      active: {
        ticker: 'NVDA',
        price: 135.24,
        changePct: 4.2,
        volume: 82000000
      },
      indices: [
        { name: 'S&P 500', value: 5842.12 }
      ]
    };
  }
}

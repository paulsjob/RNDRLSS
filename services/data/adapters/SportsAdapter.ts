
import { DataAdapter, DictionaryItem } from '../../../shared/types';

export class SportsAdapter implements DataAdapter {
  id = 'sports-v1';
  name = 'Global Sports Feed';
  description = 'Real-time coverage of NFL, NBA, and Premier League matches.';

  getDictionary(): DictionaryItem[] {
    return [
      { id: 's-home-name', key: 'Home Team Name', category: 'Game > Home Team', providerPath: 'game.home.name', dataType: 'string' },
      { id: 's-home-score', key: 'Home Team Score', category: 'Game > Home Team', providerPath: 'game.home.score', dataType: 'number' },
      { id: 's-away-name', key: 'Away Team Name', category: 'Game > Away Team', providerPath: 'game.away.name', dataType: 'string' },
      { id: 's-away-score', key: 'Away Team Score', category: 'Game > Away Team', providerPath: 'game.away.score', dataType: 'number' },
      { id: 's-clock', key: 'Game Clock', category: 'Game > Status', providerPath: 'game.clock', dataType: 'string' },
      { id: 's-qtr', key: 'Current Quarter', category: 'Game > Status', providerPath: 'game.quarter', dataType: 'number' },
      { id: 's-p1-name', key: 'Leading Player', category: 'Players > Top Performers', providerPath: 'players[0].name', dataType: 'string' },
      { id: 's-p1-yards', key: 'Passing Yards', category: 'Players > Top Performers', providerPath: 'players[0].stats.yards', dataType: 'number' }
    ];
  }

  async fetchLive(): Promise<Record<string, any>> {
    // Simulated live feed
    return {
      game: {
        home: { name: 'Seattle Seahawks', score: 24 },
        away: { name: 'San Francisco 49ers', score: 21 },
        clock: '02:45',
        quarter: 4
      },
      players: [
        { name: 'Geno Smith', stats: { yards: 342, tds: 2 } }
      ]
    };
  }
}

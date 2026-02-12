
import { DataAdapter, DictionaryItem } from '../../../shared/types';

export class WeatherAdapter implements DataAdapter {
  id = 'weather-v1';
  name = 'MeteoLive Pro';
  description = 'High-resolution weather modeling with local station support.';

  getDictionary(): DictionaryItem[] {
    return [
      { id: 'w-city', key: 'Location Name', category: 'Environment > Local', providerPath: 'current.location', dataType: 'string' },
      { id: 'w-temp', key: 'Temperature', category: 'Environment > Local', providerPath: 'current.tempC', dataType: 'number' },
      { id: 'w-cond', key: 'Conditions', category: 'Environment > Local', providerPath: 'current.condition', dataType: 'string' },
      { id: 'w-wind', key: 'Wind Speed', category: 'Atmosphere > Wind', providerPath: 'current.windKmh', dataType: 'number' },
      { id: 'w-hum', key: 'Humidity', category: 'Atmosphere > Hydrology', providerPath: 'current.humidity', dataType: 'percentage' }
    ];
  }

  async fetchLive(): Promise<Record<string, any>> {
    return {
      current: {
        location: 'Miami, FL',
        tempC: 28,
        condition: 'Partly Cloudy',
        windKmh: 12,
        humidity: 74
      }
    };
  }
}

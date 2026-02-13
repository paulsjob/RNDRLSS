
import { Dictionary, ValueType, DataDomain, KeyKind } from '../types';

/**
 * MACHINE-SAFE AGNOSTIC KEYS
 * These ULIDs are the stable identifiers used for bindings.
 */
export const MLB_KEYS = {
  GAME_STATUS: '01HT1Z9P3S6X0J8N8M1W1A0000',
  GAME_CLOCK: '01HT1Z9P3S6X0J8N8M1W1A0001',
  INNING_NUMBER: '01HT1Z9P3S6X0J8N8M1W1A0002',
  INNING_HALF: '01HT1Z9P3S6X0J8N8M1W1A0003',
  COUNT_BALLS: '01HT1Z9P3S6X0J8N8M1W1A0004',
  COUNT_STRIKES: '01HT1Z9P3S6X0J8N8M1W1A0005',
  COUNT_OUTS: '01HT1Z9P3S6X0J8N8M1W1A0006',
  SCORE_HOME: '01HT1Z9P3S6X0J8N8M1W1A0007',
  SCORE_AWAY: '01HT1Z9P3S6X0J8N8M1W1A0008',
  BASES_FIRST: '01HT1Z9P3S6X0J8N8M1W1A0009',
  BASES_SECOND: '01HT1Z9P3S6X0J8N8M1W1A0010',
  BASES_THIRD: '01HT1Z9P3S6X0J8N8M1W1A0011',
  TEAM_HOME_ABBR: '01HT1Z9P3S6X0J8N8M1W1A0012',
  TEAM_AWAY_ABBR: '01HT1Z9P3S6X0J8N8M1W1A0013',
  GAME_EVENTS: '01HT1Z9P3S6X0J8N8M1W1A0014',
} as const;

// Flattened keys for internal logic compatibility across Studio and Data Engine
const mlbKeys: any[] = [
  { keyId: MLB_KEYS.GAME_STATUS, alias: 'Game Status', valueType: ValueType.STRING, kind: KeyKind.STATE, path: 'game.status', scope: 'Game', domain: DataDomain.SPORTS, dataType: 'string' },
  { keyId: MLB_KEYS.GAME_CLOCK, alias: 'Game Clock', valueType: ValueType.STRING, kind: KeyKind.STATE, path: 'game.clock', scope: 'Game', domain: DataDomain.SPORTS, dataType: 'string' },
  { keyId: MLB_KEYS.INNING_NUMBER, alias: 'Inning', valueType: ValueType.NUMBER, kind: KeyKind.STATE, path: 'game.inning', scope: 'Inning', domain: DataDomain.SPORTS, dataType: 'number' },
  { keyId: MLB_KEYS.INNING_HALF, alias: 'Half', valueType: ValueType.STRING, kind: KeyKind.STATE, path: 'game.half', scope: 'Inning', domain: DataDomain.SPORTS, dataType: 'string' },
  { keyId: MLB_KEYS.COUNT_BALLS, alias: 'Balls', valueType: ValueType.NUMBER, kind: KeyKind.STATE, path: 'game.balls', scope: 'Count', domain: DataDomain.SPORTS, dataType: 'number' },
  { keyId: MLB_KEYS.COUNT_STRIKES, alias: 'Strikes', valueType: ValueType.NUMBER, kind: KeyKind.STATE, path: 'game.strikes', scope: 'Count', domain: DataDomain.SPORTS, dataType: 'number' },
  { keyId: MLB_KEYS.COUNT_OUTS, alias: 'Outs', valueType: ValueType.NUMBER, kind: KeyKind.STATE, path: 'game.outs', scope: 'Count', domain: DataDomain.SPORTS, dataType: 'number' },
  { keyId: MLB_KEYS.SCORE_HOME, alias: 'Home Score', valueType: ValueType.NUMBER, kind: KeyKind.STATE, path: 'game.home.score', scope: 'Scoreboard', domain: DataDomain.SPORTS, dataType: 'number' },
  { keyId: MLB_KEYS.SCORE_AWAY, alias: 'Away Score', valueType: ValueType.NUMBER, kind: KeyKind.STATE, path: 'game.away.score', scope: 'Scoreboard', domain: DataDomain.SPORTS, dataType: 'number' },
  { keyId: MLB_KEYS.BASES_FIRST, alias: 'Runner 1st', valueType: ValueType.BOOLEAN, kind: KeyKind.STATE, path: 'game.bases[0]', scope: 'Bases', domain: DataDomain.SPORTS, dataType: 'boolean' },
  { keyId: MLB_KEYS.BASES_SECOND, alias: 'Runner 2nd', valueType: ValueType.BOOLEAN, kind: KeyKind.STATE, path: 'game.bases[1]', scope: 'Bases', domain: DataDomain.SPORTS, dataType: 'boolean' },
  { keyId: MLB_KEYS.BASES_THIRD, alias: 'Runner 3rd', valueType: ValueType.BOOLEAN, kind: KeyKind.STATE, path: 'game.bases[2]', scope: 'Bases', domain: DataDomain.SPORTS, dataType: 'boolean' },
  { keyId: MLB_KEYS.TEAM_HOME_ABBR, alias: 'Home Abbr', valueType: ValueType.STRING, kind: KeyKind.STATE, path: 'game.home.abbr', scope: 'Teams', domain: DataDomain.SPORTS, dataType: 'string' },
  { keyId: MLB_KEYS.TEAM_AWAY_ABBR, alias: 'Away Abbr', valueType: ValueType.STRING, kind: KeyKind.STATE, path: 'game.away.abbr', scope: 'Teams', domain: DataDomain.SPORTS, dataType: 'string' },
  { keyId: MLB_KEYS.GAME_EVENTS, alias: 'Game Events', valueType: ValueType.ARRAY, kind: KeyKind.EVENT, path: 'events', scope: 'Log', domain: DataDomain.SPORTS, dataType: 'array' },
];

export const MLB_CANON_DICTIONARY: Dictionary = {
  dictionaryId: 'canon.sports.mlb.v2',
  version: '2.0.0',
  domain: DataDomain.SPORTS,
  root: {
    type: 'node',
    name: 'MLB',
    children: []
  },
  keys: mlbKeys
};

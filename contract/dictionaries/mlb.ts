
import { Dictionary, DataType, KeyKind, KeyScope } from '../types';

// ULID Placeholders for consistency
export const MLB_KEYS = {
  GAME_STATUS: '01HS1K7Z9P3S6X0J8N8M1W1A1B',
  INNING_NUMBER: '01HS1K7Z9P3S6X0J8N8M1W1A1C',
  INNING_HALF: '01HS1K7Z9P3S6X0J8N8M1W1A1D',
  COUNT_BALLS: '01HS1K7Z9P3S6X0J8N8M1W1A1E',
  COUNT_STRIKES: '01HS1K7Z9P3S6X0J8N8M1W1A1F',
  COUNT_OUTS: '01HS1K7Z9P3S6X0J8N8M1W1A1G',
  SCORE_HOME: '01HS1K7Z9P3S6X0J8N8M1W1A1H',
  SCORE_AWAY: '01HS1K7Z9P3S6X0J8N8M1W1A1I',
  TEAM_HOME_ABBR: '01HS1K7Z9P3S6X0J8N8M1W1A1J',
  TEAM_AWAY_ABBR: '01HS1K7Z9P3S6X0J8N8M1W1A1K',
  BASES_FIRST: '01HS1K7Z9P3S6X0J8N8M1W1A1L',
  BASES_SECOND: '01HS1K7Z9P3S6X0J8N8M1W1A1M',
  BASES_THIRD: '01HS1K7Z9P3S6X0J8N8M1W1A1N',
  BATTER_NAME: '01HS1K7Z9P3S6X0J8N8M1W1A1O',
  PITCHER_NAME: '01HS1K7Z9P3S6X0J8N8M1W1A1P',
  PITCH_SPEED: '01HS1K7Z9P3S6X0J8N8M1W1A1Q',
  PITCH_TYPE: '01HS1K7Z9P3S6X0J8N8M1W1A1R',
  PLAY_RESULT: '01HS1K7Z9P3S6X0J8N8M1W1A1S',
  GAME_EVENTS: '01HS1K7Z9P3S6X0J8N8M1W1A1T',
} as const;

export const MLB_CANON_DICTIONARY: Dictionary = {
  dictionaryId: 'canon.sports.baseball.v1',
  version: '1.0.0',
  domain: 'sports',
  keys: [
    {
      keyId: MLB_KEYS.GAME_STATUS,
      alias: 'Game Status',
      path: 'game.status',
      dataType: DataType.STRING,
      kind: KeyKind.STATE,
      scope: KeyScope.GAME,
      example: 'LIVE'
    },
    {
      keyId: MLB_KEYS.INNING_NUMBER,
      alias: 'Inning Number',
      path: 'inning.number',
      dataType: DataType.NUMBER,
      kind: KeyKind.STATE,
      scope: KeyScope.GAME,
      example: 4
    },
    {
      keyId: MLB_KEYS.INNING_HALF,
      alias: 'Inning Half',
      path: 'inning.half',
      dataType: DataType.STRING,
      kind: KeyKind.STATE,
      scope: KeyScope.GAME,
      example: 'TOP'
    },
    {
      keyId: MLB_KEYS.SCORE_HOME,
      alias: 'Home Runs',
      path: 'score.home.runs',
      dataType: DataType.NUMBER,
      kind: KeyKind.STATE,
      scope: KeyScope.TEAM,
      example: 3
    },
    {
      keyId: MLB_KEYS.SCORE_AWAY,
      alias: 'Away Runs',
      path: 'score.away.runs',
      dataType: DataType.NUMBER,
      kind: KeyKind.STATE,
      scope: KeyScope.TEAM,
      example: 2
    },
    {
      keyId: MLB_KEYS.TEAM_HOME_ABBR,
      alias: 'Home Team',
      path: 'team.home.abbr',
      dataType: DataType.STRING,
      kind: KeyKind.STATE,
      scope: KeyScope.TEAM,
      example: 'LAD'
    },
    {
      keyId: MLB_KEYS.COUNT_BALLS,
      alias: 'Balls',
      path: 'count.balls',
      dataType: DataType.NUMBER,
      kind: KeyKind.STATE,
      scope: KeyScope.GAME,
      example: 3
    },
    {
      keyId: MLB_KEYS.BASES_FIRST,
      alias: 'Runner on 1st',
      path: 'bases.first',
      dataType: DataType.BOOLEAN,
      kind: KeyKind.STATE,
      scope: KeyScope.GAME,
      example: true
    },
    {
      keyId: MLB_KEYS.GAME_EVENTS,
      alias: 'Game Events List',
      path: 'game.events',
      dataType: DataType.ARRAY,
      kind: KeyKind.EVENT,
      scope: KeyScope.GAME
    }
  ]
};

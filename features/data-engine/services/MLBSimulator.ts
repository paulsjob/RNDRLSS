
import { liveBus } from '../../../shared/data-runtime';
import { MLB_KEYS, MLB_CANON_DICTIONARY } from '../../../contract/dictionaries/mlb';

export interface SimulationScenario {
  id: string;
  label: string;
  description: string;
  icon: string;
  state: Partial<MLBSimState>;
}

interface MLBSimState {
  inning: number;
  half: 'TOP' | 'BOT';
  balls: number;
  strikes: number;
  outs: number;
  scoreHome: number;
  scoreAway: number;
  bases: [boolean, boolean, boolean];
}

export const MLB_SCENARIOS: SimulationScenario[] = [
  {
    id: 'opening_pitch',
    label: 'Opening Pitch',
    description: 'Fresh game, clean slate, first inning start.',
    icon: '☀️',
    state: { inning: 1, half: 'TOP', balls: 0, strikes: 0, outs: 0, scoreHome: 0, scoreAway: 0, bases: [false, false, false] }
  },
  {
    id: 'bases_loaded_clutch',
    label: 'Clutch Pressure',
    description: 'Bottom of the 4th, bases juiced, 2 outs. Tension is high.',
    icon: '🔥',
    state: { inning: 4, half: 'BOT', balls: 3, strikes: 2, outs: 2, scoreHome: 2, scoreAway: 1, bases: [true, true, true] }
  },
  {
    id: 'walk_off_threat',
    label: 'Walk-off Setup',
    description: 'Bottom of the 9th, tie game, runner on 3rd.',
    icon: '⚡',
    state: { inning: 9, half: 'BOT', balls: 1, strikes: 1, outs: 1, scoreHome: 4, scoreAway: 4, bases: [false, false, true] }
  },
  {
    id: 'extra_innings',
    label: 'Extras Tension',
    description: 'Game goes to the 10th. Ghost runner on 2nd.',
    icon: '⏳',
    state: { inning: 10, half: 'TOP', balls: 0, strikes: 0, outs: 0, scoreHome: 5, scoreAway: 5, bases: [false, true, false] }
  }
];

export class MLBSimulator {
  private interval: any = null;
  private seq = 0;
  private state: MLBSimState = {
    inning: 1,
    half: 'TOP',
    balls: 0,
    strikes: 0,
    outs: 0,
    scoreHome: 0,
    scoreAway: 0,
    bases: [false, false, false],
  };

  public applyScenario(scenarioId: string) {
    const scenario = MLB_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;

    this.state = { ...this.state, ...scenario.state };
    this.publishSnapshot();
    
    liveBus.publish({
      type: 'event',
      dictionaryId: MLB_CANON_DICTIONARY.dictionaryId,
      dictionaryVersion: MLB_CANON_DICTIONARY.version,
      sourceId: 'sim_mlb_01',
      seq: ++this.seq,
      ts: Date.now(),
      eventKeyId: MLB_KEYS.GAME_EVENTS,
      payload: { event: 'SCENARIO_LOADED', scenario: scenario.label, description: scenario.description }
    });
  }

  public start(tickRateMs = 2000) {
    if (this.interval) return;
    this.publishSnapshot();
    this.interval = setInterval(() => {
      this.tick();
    }, tickRateMs);
  }

  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  public step() {
    this.tick();
  }

  private tick() {
    const roll = Math.random();
    let eventType: string | null = null;
    let eventPayload: any = null;
    
    if (roll < 0.5) {
      if (Math.random() > 0.4) {
        this.state.strikes++;
        if (this.state.strikes >= 3) {
           this.recordOut('Strikeout');
           eventType = 'STRIKEOUT';
        }
      } else {
        this.state.balls++;
        if (this.state.balls >= 4) {
           this.recordWalk();
           eventType = 'WALK';
        }
      }
    } else if (roll < 0.8) {
      if (Math.random() > 0.65) {
        this.recordHit();
        eventType = 'HIT';
      } else {
        this.recordOut('Fly out');
        eventType = 'FLY_OUT';
      }
    } else {
      this.state.strikes = Math.min(2, this.state.strikes + 1);
      eventType = 'FOUL';
    }

    this.publishDelta();
    
    if (eventType) {
      liveBus.publish({
        type: 'event',
        dictionaryId: MLB_CANON_DICTIONARY.dictionaryId,
        dictionaryVersion: MLB_CANON_DICTIONARY.version,
        sourceId: 'sim_mlb_01',
        seq: ++this.seq,
        ts: Date.now(),
        eventKeyId: MLB_KEYS.GAME_EVENTS,
        payload: { event: eventType, score: `${this.state.scoreAway}-${this.state.scoreHome}`, ...eventPayload }
      });
    }
  }

  private recordOut(reason: string) {
    this.state.balls = 0;
    this.state.strikes = 0;
    this.state.outs++;

    if (this.state.outs >= 3) {
      this.state.outs = 0;
      this.state.bases = [false, false, false];
      if (this.state.half === 'TOP') {
        this.state.half = 'BOT';
      } else {
        this.state.half = 'TOP';
        this.state.inning++;
      }
    }
  }

  private recordWalk() {
    this.state.balls = 0;
    this.state.strikes = 0;
    this.advanceRunners();
  }

  private recordHit() {
    this.state.balls = 0;
    this.state.strikes = 0;
    this.advanceRunners();
  }

  private advanceRunners() {
    if (this.state.bases[2]) {
      if (this.state.half === 'TOP') this.state.scoreAway++;
      else this.state.scoreHome++;
    }
    this.state.bases = [true, this.state.bases[0], this.state.bases[1]];
  }

  private publishSnapshot() {
    liveBus.publish({
      type: 'snapshot',
      dictionaryId: MLB_CANON_DICTIONARY.dictionaryId,
      dictionaryVersion: MLB_CANON_DICTIONARY.version,
      sourceId: 'sim_mlb_01',
      seq: ++this.seq,
      ts: Date.now(),
      values: {
        [MLB_KEYS.GAME_STATUS]: 'LIVE',
        [MLB_KEYS.INNING_NUMBER]: this.state.inning,
        [MLB_KEYS.INNING_HALF]: this.state.half,
        [MLB_KEYS.COUNT_BALLS]: this.state.balls,
        [MLB_KEYS.COUNT_STRIKES]: this.state.strikes,
        [MLB_KEYS.COUNT_OUTS]: this.state.outs,
        [MLB_KEYS.SCORE_HOME]: this.state.scoreHome,
        [MLB_KEYS.SCORE_AWAY]: this.state.scoreAway,
        [MLB_KEYS.BASES_FIRST]: this.state.bases[0],
        [MLB_KEYS.BASES_SECOND]: this.state.bases[1],
        [MLB_KEYS.BASES_THIRD]: this.state.bases[2],
        [MLB_KEYS.TEAM_HOME_ABBR]: 'LAD',
        [MLB_KEYS.TEAM_AWAY_ABBR]: 'NYY'
      }
    });
  }

  private publishDelta() {
    liveBus.publish({
      type: 'delta',
      dictionaryId: MLB_CANON_DICTIONARY.dictionaryId,
      dictionaryVersion: MLB_CANON_DICTIONARY.version,
      sourceId: 'sim_mlb_01',
      seq: ++this.seq,
      ts: Date.now(),
      changes: [
        { keyId: MLB_KEYS.INNING_NUMBER, value: this.state.inning },
        { keyId: MLB_KEYS.INNING_HALF, value: this.state.half },
        { keyId: MLB_KEYS.COUNT_BALLS, value: this.state.balls },
        { keyId: MLB_KEYS.COUNT_STRIKES, value: this.state.strikes },
        { keyId: MLB_KEYS.COUNT_OUTS, value: this.state.outs },
        { keyId: MLB_KEYS.SCORE_HOME, value: this.state.scoreHome },
        { keyId: MLB_KEYS.SCORE_AWAY, value: this.state.scoreAway },
        { keyId: MLB_KEYS.BASES_FIRST, value: this.state.bases[0] },
        { keyId: MLB_KEYS.BASES_SECOND, value: this.state.bases[1] },
        { keyId: MLB_KEYS.BASES_THIRD, value: this.state.bases[2] },
      ]
    });
  }
}

export const mlbSimulator = new MLBSimulator();


import { liveBus } from '../../../shared/data-runtime';
import { MLB_KEYS, MLB_CANON_DICTIONARY } from '../../../contract/dictionaries/mlb';

export type SimulationPreset = 'inning_start' | 'bases_loaded' | 'close_game' | 'blowout';

export class MLBSimulator {
  private interval: any = null;
  private seq = 0;
  private state = {
    inning: 1,
    half: 'TOP',
    balls: 0,
    strikes: 0,
    outs: 0,
    scoreHome: 0,
    scoreAway: 0,
    bases: [false, false, false], // [1st, 2nd, 3rd]
  };

  public applyPreset(preset: SimulationPreset) {
    switch (preset) {
      case 'inning_start':
        this.state = {
          inning: 1,
          half: 'TOP',
          balls: 0,
          strikes: 0,
          outs: 0,
          scoreHome: 0,
          scoreAway: 0,
          bases: [false, false, false],
        };
        break;
      case 'bases_loaded':
        this.state = {
          inning: 4,
          half: 'BOT',
          balls: 3,
          strikes: 2,
          outs: 2,
          scoreHome: 2,
          scoreAway: 1,
          bases: [true, true, true],
        };
        break;
      case 'close_game':
        this.state = {
          inning: 9,
          half: 'TOP',
          balls: 1,
          strikes: 1,
          outs: 1,
          scoreHome: 4,
          scoreAway: 3,
          bases: [true, false, false],
        };
        break;
      case 'blowout':
        this.state = {
          inning: 7,
          half: 'BOT',
          balls: 0,
          strikes: 0,
          outs: 0,
          scoreHome: 12,
          scoreAway: 2,
          bases: [false, false, false],
        };
        break;
    }
    
    this.publishSnapshot();
    
    liveBus.publish({
      type: 'event',
      dictionaryId: MLB_CANON_DICTIONARY.dictionaryId,
      dictionaryVersion: MLB_CANON_DICTIONARY.version,
      sourceId: 'sim_mlb_01',
      seq: ++this.seq,
      ts: Date.now(),
      eventKeyId: MLB_KEYS.GAME_EVENTS,
      payload: { event: 'PRESET_APPLIED', scenario: preset.toUpperCase().replace('_', ' ') }
    });
  }

  public start(tickRateMs = 1500) {
    if (this.interval) return;

    console.log('[MLBSimulator] Starting Simulation...');
    this.publishSnapshot();

    this.interval = setInterval(() => {
      this.tick();
    }, tickRateMs);
  }

  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('[MLBSimulator] Simulation Stopped.');
    }
  }

  public reset() {
    this.applyPreset('inning_start');
  }

  private tick() {
    const roll = Math.random();
    
    if (roll < 0.5) {
      // Common pitch outcome: Strike or Ball
      if (Math.random() > 0.4) {
        this.state.strikes++;
        if (this.state.strikes >= 3) this.recordOut('Strikeout');
      } else {
        this.state.balls++;
        if (this.state.balls >= 4) this.recordWalk();
      }
    } else if (roll < 0.85) {
      // Play outcome: Hit or Fly out
      if (Math.random() > 0.65) {
        this.recordHit();
      } else {
        this.recordOut('Fly out');
      }
    } else {
      // Rare outcome: Foul ball or nothing
      this.state.strikes = Math.min(2, this.state.strikes + 1);
    }

    this.publishDelta();
  }

  private recordOut(reason: string) {
    this.state.balls = 0;
    this.state.strikes = 0;
    this.state.outs++;

    liveBus.publish({
      type: 'event',
      dictionaryId: MLB_CANON_DICTIONARY.dictionaryId,
      dictionaryVersion: MLB_CANON_DICTIONARY.version,
      sourceId: 'sim_mlb_01',
      seq: ++this.seq,
      ts: Date.now(),
      eventKeyId: MLB_KEYS.GAME_EVENTS,
      payload: { event: 'OUT', reason, current_outs: this.state.outs }
    });

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
    this.advanceRunners('WALK');
  }

  private recordHit() {
    this.state.balls = 0;
    this.state.strikes = 0;
    this.advanceRunners('HIT');
  }

  private advanceRunners(type: 'HIT' | 'WALK') {
    // Scoring logic
    if (this.state.bases[2]) {
      if (this.state.half === 'TOP') this.state.scoreAway++;
      else this.state.scoreHome++;
    }
    
    // Shift runners
    this.state.bases = [true, this.state.bases[0], this.state.bases[1]];

    liveBus.publish({
      type: 'event',
      dictionaryId: MLB_CANON_DICTIONARY.dictionaryId,
      dictionaryVersion: MLB_CANON_DICTIONARY.version,
      sourceId: 'sim_mlb_01',
      seq: ++this.seq,
      ts: Date.now(),
      eventKeyId: MLB_KEYS.GAME_EVENTS,
      payload: { event: type, score: `${this.state.scoreAway}-${this.state.scoreHome}` }
    });
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

/**
 * Web Audio API procedural sound synthesizer and music engine for CyberStrike 3D.
 * 100% self-contained, real-time procedural audio with zero external asset dependencies.
 */

export type MusicTrack = 'cyber_assault' | 'dark_drone' | 'synth_wave';

class SoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private sfxVolume: number = 0.7;
  private musicVolume: number = 0.45;
  private isMusicPlaying: boolean = false;
  private currentTrack: MusicTrack = 'cyber_assault';

  // Music state
  private musicMasterGain: GainNode | null = null;
  private musicTimerId: number | null = null;
  private droneOscs: OscillatorNode[] = [];
  private droneFilter: BiquadFilterNode | null = null;
  private stepCount: number = 0;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
  }

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicMasterGain && this.ctx) {
      const gainVal = this.isMuted || !this.isMusicPlaying ? 0 : this.musicVolume;
      this.musicMasterGain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
    }
  }

  public setVolume(val: number) {
    // Legacy support: sets both
    this.setSfxVolume(val);
    this.setMusicVolume(val * 0.7);
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.musicMasterGain && this.ctx) {
      this.musicMasterGain.gain.setValueAtTime(this.isMuted || !this.isMusicPlaying ? 0 : this.musicVolume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.musicMasterGain && this.ctx) {
      this.musicMasterGain.gain.setValueAtTime(this.isMuted || !this.isMusicPlaying ? 0 : this.musicVolume, this.ctx.currentTime);
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public getMusicTrack(): MusicTrack {
    return this.currentTrack;
  }

  /* ---------------- SFX METHODS ---------------- */

  public playShoot(type: 'rifle' | 'shotgun' | 'sniper') {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    if (type === 'rifle') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.09);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, t);
      filter.frequency.linearRampToValueAtTime(300, t + 0.08);

      gain.gain.setValueAtTime(this.sfxVolume * 0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      const noiseBuffer = this.createNoiseBuffer(0.06);
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(this.sfxVolume * 0.45, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.1);
      noise.start(t);
    } else if (type === 'shotgun') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.22);

      gain.gain.setValueAtTime(this.sfxVolume * 0.8, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      const noise = this.ctx.createBufferSource();
      noise.buffer = this.createNoiseBuffer(0.18);
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, t);
      filter.frequency.exponentialRampToValueAtTime(200, t + 0.18);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(this.sfxVolume * 0.7, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.24);
      noise.start(t);
    } else if (type === 'sniper') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.25);

      gain.gain.setValueAtTime(this.sfxVolume * 0.75, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      const sub = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      sub.type = 'sawtooth';
      sub.frequency.setValueAtTime(160, t);
      sub.frequency.exponentialRampToValueAtTime(30, t + 0.3);
      subGain.gain.setValueAtTime(this.sfxVolume * 0.6, t);
      subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      sub.connect(subGain);
      subGain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.26);
      sub.start(t);
      sub.stop(t + 0.32);
    }
  }

  public playEnemyShoot() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.08);

    gain.gain.setValueAtTime(this.sfxVolume * 0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playHitMarker() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, t);
    osc.frequency.setValueAtTime(2200, t + 0.02);

    gain.gain.setValueAtTime(this.sfxVolume * 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  public playExplosion() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(0.5);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.linearRampToValueAtTime(80, t + 0.45);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.sfxVolume * 0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(90, t);
    sub.frequency.exponentialRampToValueAtTime(20, t + 0.4);
    subGain.gain.setValueAtTime(this.sfxVolume * 0.7, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    sub.connect(subGain);
    subGain.connect(this.ctx.destination);

    noise.start(t);
    sub.start(t);
    sub.stop(t + 0.45);
  }

  public playPlayerHurt() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.15);

    gain.gain.setValueAtTime(this.sfxVolume * 0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  public playReload() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    this.playClick(t, 600, 0.05);
    this.playClick(t + 0.4, 800, 0.05);
    this.playClick(t + 0.75, 1200, 0.07);
  }

  private playClick(time: number, freq: number, dur: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(180, time + dur);
    gain.gain.setValueAtTime(this.sfxVolume * 0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + dur + 0.01);
  }

  public playPickup() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = t + idx * 0.04;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(this.sfxVolume * 0.28, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.14);
    });
  }

  public playJump() {
    if (this.isMuted || this.sfxVolume <= 0) return;
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.1);

    gain.gain.setValueAtTime(this.sfxVolume * 0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  /* ---------------- PROCEDURAL MUSIC SYSTEM ---------------- */

  public setMusicTrack(track: MusicTrack) {
    this.currentTrack = track;
    if (this.isMusicPlaying) {
      this.stopMusic();
      this.startMusic();
    }
  }

  public startAmbient() {
    this.startMusic();
  }

  public stopAmbient() {
    this.stopMusic();
  }

  public toggleMusic(enable?: boolean): boolean {
    const targetState = enable !== undefined ? enable : !this.isMusicPlaying;
    if (targetState) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.isMusicPlaying;
  }

  public startMusic() {
    if (this.isMusicPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      this.isMusicPlaying = true;
      const t = this.ctx.currentTime;

      if (!this.musicMasterGain) {
        this.musicMasterGain = this.ctx.createGain();
        this.musicMasterGain.connect(this.ctx.destination);
      }
      const gainVal = this.isMuted ? 0 : this.musicVolume;
      this.musicMasterGain.gain.setValueAtTime(gainVal, t);

      if (this.currentTrack === 'dark_drone') {
        this.startDroneMusic();
      } else {
        this.startSequencedMusic();
      }
    } catch {
      // Audio policy catch
    }
  }

  public stopMusic() {
    if (this.musicTimerId !== null) {
      window.clearInterval(this.musicTimerId);
      this.musicTimerId = null;
    }

    this.droneOscs.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore
      }
    });
    this.droneOscs = [];
    this.droneFilter = null;
    this.isMusicPlaying = false;
  }

  private startDroneMusic() {
    if (!this.ctx || !this.musicMasterGain) return;
    const t = this.ctx.currentTime;

    // Sub-bass drone + ethereal high tone
    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.setValueAtTime(140, t);
    this.droneFilter.connect(this.musicMasterGain);

    const rootFreq = 55; // Low A
    const freqs = [rootFreq, rootFreq * 1.5, rootFreq * 2.01];

    freqs.forEach((f, idx) => {
      if (!this.ctx || !this.droneFilter) return;
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = idx === 0 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(f, t);

      oscGain.gain.setValueAtTime(idx === 0 ? 0.4 : 0.2, t);
      osc.connect(oscGain);
      oscGain.connect(this.droneFilter);

      osc.start(t);
      this.droneOscs.push(osc);
    });
  }

  private startSequencedMusic() {
    if (!this.ctx || !this.musicMasterGain) return;

    // BPM & Step Interval
    const bpm = this.currentTrack === 'cyber_assault' ? 128 : 112;
    const stepIntervalMs = (60 / bpm / 4) * 1000; // 16th notes

    // Minor Pentatonic scale notes
    const assaultScale = [55, 65.41, 73.42, 82.41, 98.0, 110, 130.81, 146.83, 164.81]; // A minor
    const synthwaveScale = [65.41, 82.41, 98.0, 123.47, 130.81, 164.81, 196.0, 246.94]; // C major / A minor

    this.stepCount = 0;

    this.musicTimerId = window.setInterval(() => {
      if (!this.ctx || !this.musicMasterGain || !this.isMusicPlaying) return;
      const now = this.ctx.currentTime;
      const step = this.stepCount % 16;
      this.stepCount++;

      // 1. Kick/Pulse Bass Drum on 1, 5, 9, 13
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(110, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

        kickGain.gain.setValueAtTime(0.4, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        kickOsc.connect(kickGain);
        kickGain.connect(this.musicMasterGain);
        kickOsc.start(now);
        kickOsc.stop(now + 0.1);
      }

      // 2. Synth Arpeggio Voice
      const scale = this.currentTrack === 'cyber_assault' ? assaultScale : synthwaveScale;
      // Arp pattern index
      const arpPatterns = [0, 2, 4, 3, 5, 4, 2, 1, 0, 3, 5, 7, 5, 4, 2, 0];
      const noteFreq = scale[arpPatterns[step] % scale.length];

      const synthOsc = this.ctx.createOscillator();
      const synthGain = this.ctx.createGain();
      const synthFilter = this.ctx.createBiquadFilter();

      synthOsc.type = this.currentTrack === 'cyber_assault' ? 'sawtooth' : 'triangle';
      synthOsc.frequency.setValueAtTime(noteFreq * (this.currentTrack === 'synth_wave' ? 2 : 1), now);

      synthFilter.type = 'lowpass';
      const cutoff = 400 + Math.sin(this.stepCount * 0.15) * 800;
      synthFilter.frequency.setValueAtTime(cutoff, now);
      synthFilter.Q.setValueAtTime(4, now);

      synthGain.gain.setValueAtTime(0.22, now);
      synthGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      synthOsc.connect(synthFilter);
      synthFilter.connect(synthGain);
      synthGain.connect(this.musicMasterGain);

      synthOsc.start(now);
      synthOsc.stop(now + 0.12);
    }, stepIntervalMs);
  }

  private createNoiseBuffer(duration: number): AudioBuffer {
    if (!this.ctx) throw new Error('No audio context');
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}

export const sound = new SoundSystem();

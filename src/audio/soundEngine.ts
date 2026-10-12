// Dynamic Procedural Sound & Music Synthesizer (Web Audio API)

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  
  private isMusicPlaying: boolean = false;
  private musicTimer: number | null = null;
  private beatStep: number = 0;
  private tension: number = 0; // 0 (calm) to 1.0 (extreme tension)
  
  public musicEnabled: boolean = true;
  public sfxEnabled: boolean = true;
  public musicVolume: number = 0.5;
  public sfxVolume: number = 0.7;

  private noteFrequencies: Record<string, number> = {
    'C3': 130.81, 'D3': 146.83, 'Eb3': 155.56, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'Ab3': 207.65, 'A3': 220.00, 'Bb3': 233.08, 'B3': 246.94,
    'C4': 261.63, 'D4': 293.66, 'Eb4': 311.13, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'Ab4': 415.30, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'Eb5': 622.25, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'Ab5': 830.61, 'A5': 880.00, 'Bb5': 932.33, 'B5': 987.77,
    'C6': 1046.50
  };

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setTension(val: number) {
    this.tension = Math.max(0, Math.min(1, val));
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicEnabled ? this.musicVolume : 0, this.ctx.currentTime);
    }
  }

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? this.sfxVolume : 0, this.ctx.currentTime);
    }
  }

  public toggleMusic(enabled: boolean) {
    this.musicEnabled = enabled;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(enabled ? this.musicVolume : 0, this.ctx.currentTime);
    }
    if (enabled && !this.isMusicPlaying) {
      this.startDynamicMusic();
    } else if (!enabled && this.isMusicPlaying) {
      this.stopDynamicMusic();
    }
  }

  public toggleSfx(enabled: boolean) {
    this.sfxEnabled = enabled;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(enabled ? this.sfxVolume : 0, this.ctx.currentTime);
    }
  }

  // -------------------------------------------------------------
  // Dynamic Soundtrack Loop
  // -------------------------------------------------------------
  public startDynamicMusic() {
    this.initContext();
    if (!this.musicEnabled || this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.beatStep = 0;
    this.scheduleNextBeat();
  }

  public stopDynamicMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private scheduleNextBeat() {
    if (!this.isMusicPlaying) return;

    // Tempo increases slightly with tension (from 125 BPM up to 155 BPM)
    const bpm = 125 + this.tension * 30;
    const stepDuration = (60 / bpm) / 4; // 16th notes

    this.playDynamicStep(this.beatStep);
    this.beatStep = (this.beatStep + 1) % 32;

    this.musicTimer = window.setTimeout(() => {
      this.scheduleNextBeat();
    }, stepDuration * 1000);
  }

  private playDynamicStep(step: number) {
    if (!this.ctx || !this.musicGain || !this.musicEnabled) return;
    const now = this.ctx.currentTime;

    // Bass line notes (Cyberpunk / Retro synth progression: C -> Eb -> F -> G/Ab)
    const chordIdx = Math.floor(step / 8);
    const bassChords = ['C3', 'Eb3', 'F3', 'G3'];
    const tenseBassChords = ['C3', 'Ab3', 'Bb3', 'B3'];
    const currentChord = this.tension > 0.6 ? tenseBassChords[chordIdx] : bassChords[chordIdx];

    // Layer 1: Bass pulse on steps 0, 3, 6, 8, 11, 14
    if ([0, 3, 6, 8, 11, 14].includes(step % 16)) {
      this.playSynthNote(this.noteFrequencies[currentChord] || 130.81, now, 0.14, 'sawtooth', 0.22, this.musicGain);
    }

    // Layer 2: Percussion (Drums & Hi-hats)
    // Low tension: quiet hi-hat on every 4th step
    // Mid tension: Kick on 0, 8 + Snare on 4, 12 + continuous hi-hats
    // High tension: Double kicks, fast rolls, heavy sub-punch
    if (this.tension > 0.2) {
      if (step % 8 === 0 || (this.tension > 0.6 && step % 8 === 6)) {
        this.playDrumKick(now);
      }
      if (step % 8 === 4) {
        this.playDrumSnare(now);
      }
      if (step % 2 === 0) {
        this.playDrumHiHat(now, step % 4 === 2 ? 0.08 : 0.04);
      }
    } else {
      if (step % 8 === 0) {
        this.playDrumKick(now, 0.12);
      }
      if (step % 4 === 0) {
        this.playDrumHiHat(now, 0.03);
      }
    }

    // Layer 3: Melodic Arpeggiator (Adapts to tension)
    // Calm arpeggio: pentatonic major/minor
    // Tense arpeggio: faster, minor second / tritone intervals, higher octave
    const arpNotesCalm = ['C4', 'Eb4', 'G4', 'C5', 'Eb4', 'G4', 'Bb4', 'G4'];
    const arpNotesTense = ['C5', 'Eb5', 'Gb5', 'G5', 'Ab5', 'G5', 'Eb5', 'D5'];
    const activeArp = this.tension > 0.5 ? arpNotesTense : arpNotesCalm;
    const arpNoteName = activeArp[step % activeArp.length];
    
    // Play lead voice
    if (this.tension > 0.1) {
      const vol = 0.08 + this.tension * 0.12;
      const type: OscillatorType = this.tension > 0.6 ? 'sawtooth' : 'square';
      this.playSynthNote(this.noteFrequencies[arpNoteName] || 440, now, 0.09, type, vol, this.musicGain);
    }

    // Layer 4: Extreme Tension Warning siren / drone (Tension > 0.75)
    if (this.tension > 0.75 && step % 16 === 0) {
      this.playTensionStab(now);
    }
  }

  private playSynthNote(freq: number, time: number, duration: number, type: OscillatorType, volume: number, dest: GainNode) {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(type === 'sawtooth' ? 1200 : 800, time);
      filter.frequency.exponentialRampToValueAtTime(300, time + duration);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(time);
      osc.stop(time + duration);
    } catch {
      // Audio node cleanup catch
    }
  }

  private playDrumKick(time: number, maxVol = 0.3) {
    if (!this.ctx || !this.musicGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);
      gain.gain.setValueAtTime(maxVol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.12);
    } catch {}
  }

  private playDrumSnare(time: number) {
    if (!this.ctx || !this.musicGain) return;
    try {
      // Noise burst for snare snap
      const bufferSize = this.ctx.sampleRate * 0.1;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1000, time);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      noise.start(time);
    } catch {}
  }

  private playDrumHiHat(time: number, vol = 0.05) {
    if (!this.ctx || !this.musicGain) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.03;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7000, time);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      noise.start(time);
    } catch {}
  }

  private playTensionStab(time: number) {
    if (!this.ctx || !this.musicGain) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, time);
      osc.frequency.exponentialRampToValueAtTime(440, time + 0.3);
      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.35);
    } catch {}
  }

  // -------------------------------------------------------------
  // Sound Effects (SFX)
  // -------------------------------------------------------------
  public playJump() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  public playDoubleJump() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.16);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {}
  }

  public playDash() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.15);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(now);
    } catch {}
  }

  public playStomp() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {}
  }

  public playCoin() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.06); // E6
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {}
  }

  public playGem() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const freqs = [659.25, 830.61, 987.77, 1318.51];
      freqs.forEach((f, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.04);
        gain.gain.setValueAtTime(0.18, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.25);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.25);
      });
    } catch {}
  }

  public playHurt() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.18);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {}
  }

  public playSpring() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.18);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.22);
    } catch {}
  }

  public playEnemyDefeat() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.15);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  public playLevelClear() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const victoryNotes = [523.25, 659.25, 783.99, 1046.50];
      victoryNotes.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, now + i * 0.1);
        gain.gain.setValueAtTime(0.25, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.4);
      });
    } catch {}
  }

  public playClick() {
    if (!this.sfxEnabled) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(900, now + 0.02);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }
}

export const sound = new SoundEngine();

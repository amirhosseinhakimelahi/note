// High-quality Web Audio synthetic sound synthesis for Daylight

import { AlarmSound, NotificationSound } from '../types';

let audioCtx: AudioContext | null = null;
let activeAlarmLoopTimer: number | null = null;

// Ambient soundscape nodes
let ambientSourceNode: AudioNode | null = null;
let ambientGainNode: GainNode | null = null;
let currentAmbientType: 'brown_noise' | 'rain' | 'stream' | 'binaural_alpha' | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// ----------------- Notification Sounds -----------------
export function playNotificationSound(sound: NotificationSound = 'crystal_ping'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    switch (sound) {
      case 'crystal_ping': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1318.51, now); // E6
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.85);
        break;
      }
      case 'soft_tap': {
        [now, now + 0.09].forEach((t, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(587.33 + i * 120, t);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.13);
        });
        break;
      }
      case 'warm_chord': {
        [523.25, 659.25].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.95);
        });
        break;
      }
      case 'dewdrop': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1174.66, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.42);
        break;
      }
    }
  } catch (e) {
    console.warn('Notification audio playback failed:', e);
  }
}

// ----------------- Alarm Sounds -----------------
export function playAlarmSoundOnce(sound: AlarmSound = 'gentle_chimes'): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    switch (sound) {
      case 'gentle_chimes': {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);
          gain.gain.setValueAtTime(0, now + idx * 0.15);
          gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.15 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 1.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 1.25);
        });
        break;
      }
      case 'morning_sunrise': {
        const chord = [329.63, 440.0, 554.37, 659.25];
        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.18);
          gain.gain.setValueAtTime(0, now + idx * 0.18);
          gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.18 + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.18 + 1.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.18);
          osc.stop(now + idx * 0.18 + 1.45);
        });
        break;
      }
      case 'zen_bell': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, now);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 2.5);
        break;
      }
      case 'melodic_harp': {
        const chord = [392.0, 493.88, 587.33, 783.99]; // G major
        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0, now + idx * 0.12);
          gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.12 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 1.25);
        });
        break;
      }
      case 'calm_breeze': {
        const chord = [261.63, 329.63, 392.0, 523.25]; // C major
        chord.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.2);
          gain.gain.setValueAtTime(0, now + idx * 0.2);
          gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.2 + 0.1);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.2 + 1.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.2);
          osc.stop(now + idx * 0.2 + 1.55);
        });
        break;
      }
    }
  } catch (e) {
    console.warn('Alarm audio playback failed:', e);
  }
}

/**
 * Starts continuous alarm ringing loop until stopAlarmRinging() is called.
 */
export function startAlarmRinging(sound: AlarmSound = 'gentle_chimes'): void {
  stopAlarmRinging();
  playAlarmSoundOnce(sound);
  activeAlarmLoopTimer = window.setInterval(() => {
    playAlarmSoundOnce(sound);
  }, 2800);
}

export function stopAlarmRinging(): void {
  if (activeAlarmLoopTimer !== null) {
    clearInterval(activeAlarmLoopTimer);
    activeAlarmLoopTimer = null;
  }
}

export function playGentleChime(): void {
  playNotificationSound('warm_chord');
}

export function triggerVibration(pattern: number[] = [100, 50, 150]): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (e) {
    console.warn('Vibration not supported or disallowed:', e);
  }
}

// ----------------- FOCUS AMBIENT SOUNDSCAPES (Web Audio Synthesizer) -----------------
export function startAmbientSound(
  type: 'brown_noise' | 'rain' | 'stream' | 'binaural_alpha',
  volume = 0.25
): void {
  stopAmbientSound();
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.5);
    gainNode.connect(ctx.destination);
    ambientGainNode = gainNode;
    currentAmbientType = type;

    if (type === 'binaural_alpha') {
      // 200Hz in left ear, 210Hz in right ear = 10Hz Alpha flow frequency
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(196, ctx.currentTime);
      osc2.frequency.setValueAtTime(206, ctx.currentTime);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      osc1.start();
      osc2.start();

      ambientSourceNode = osc1;
    } else {
      // Procedural Noise Buffer
      const bufferSize = ctx.sampleRate * 2; // 2 seconds loop
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'brown_noise') {
          // Brown noise integration
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        } else if (type === 'rain') {
          // Rain pink/filtered texture
          output[i] = (lastOut + 0.05 * white) / 1.05;
          lastOut = output[i];
          output[i] *= 2.2;
        } else {
          // Stream water texture
          output[i] = white * 0.4;
        }
      }

      const whiteNoiseSource = ctx.createBufferSource();
      whiteNoiseSource.buffer = noiseBuffer;
      whiteNoiseSource.loop = true;

      // Filter
      const filter = ctx.createBiquadFilter();
      if (type === 'brown_noise') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);
      } else if (type === 'rain') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(950, ctx.currentTime);
        filter.Q.setValueAtTime(0.8, ctx.currentTime);
      } else {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
      }

      whiteNoiseSource.connect(filter);
      filter.connect(gainNode);
      whiteNoiseSource.start();

      ambientSourceNode = whiteNoiseSource;
    }
  } catch (err) {
    console.warn('Ambient soundscape failed:', err);
  }
}

export function stopAmbientSound(): void {
  if (ambientGainNode && audioCtx) {
    try {
      ambientGainNode.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.3);
    } catch {
      // Ignore if closed
    }
  }
  setTimeout(() => {
    try {
      if (ambientSourceNode && 'stop' in ambientSourceNode) {
        (ambientSourceNode as AudioScheduledSourceNode).stop();
      }
    } catch {
      // Ignore
    }
    ambientSourceNode = null;
    ambientGainNode = null;
    currentAmbientType = null;
  }, 350);
}

export function getCurrentAmbientType(): 'brown_noise' | 'rain' | 'stream' | 'binaural_alpha' | null {
  return currentAmbientType;
}

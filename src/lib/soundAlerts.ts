/**
 * @file soundAlerts.ts
 * @module المكتبات والمحركات الأساسية (Core Libraries)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: soundAlerts.ts.
 */
// MARO ERP - Sound Alerts & Audio Notification Engine
// Built using Web Audio API to guarantee offline-first, low-latency, and cross-browser reliability

class SoundAlertsEngine {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      } catch (e) {
        console.error('Web Audio API is not supported in this browser:', e);
      }
    }
    
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    
    return this.audioCtx;
  }

  /**
   * Plays a beautiful rising arpeggio indicating success or successful save
   */
  public playSuccess() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Quick nice three-tone rising chord (C5 -> E5 -> G5)
      const tones = [523.25, 659.25, 783.99]; 
      
      tones.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        
        gain.gain.setValueAtTime(0.15, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } catch (err) {
      console.warn('Could not play success sound alert:', err);
    }
  }

  /**
   * Plays a double-tone bell sound indicating a successful configuration/save action
   */
  public playSave() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // High sweet chime (A5 -> D6)
      const tones = [880.00, 1174.66];
      
      tones.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        
        gain.gain.setValueAtTime(0.12, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.25);
      });
    } catch (err) {
      console.warn('Could not play save sound alert:', err);
    }
  }

  /**
   * Plays a warning double-buzzer tone for validation warnings or missing inputs
   */
  public playWarning() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(120, now + 0.2);
      
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (err) {
      console.warn('Could not play warning sound alert:', err);
    }
  }
}

export const soundAlerts = new SoundAlertsEngine();

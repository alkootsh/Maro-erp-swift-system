/**
 * @file utils.ts
 * @module المكتبات والمحركات الأساسية (Core Libraries)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: utils.ts.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
  }).format(amount);
}

export function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
  }).format(d);
}

// premium synthesized offline sounds for MARO ERP Desktop experience
export function playSystemChime(type: 'success' | 'warning' | 'error' | 'confirm' = 'success') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'success' || type === 'confirm') {
      // Ascending premium bell-chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
      osc.start();
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.24); // C6
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
      osc.stop(ctx.currentTime + 0.45);
    } else if (type === 'warning') {
      // Soft alert warning bell
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440.00, ctx.currentTime); // A4
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.frequency.setValueAtTime(392.00, ctx.currentTime + 0.12); // G4
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'error') {
      // Low dual error buzzer
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180.00, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.07, ctx.currentTime);
      osc.start();
      osc.frequency.setValueAtTime(150.00, ctx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.warn('Audio Context is blocked or not supported yet: ', e);
  }
}

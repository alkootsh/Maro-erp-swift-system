/**
 * @file usbScannerEngine.ts
 * @module خدمات النظام (Services)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: usbScannerEngine.ts.
 */
// MARO ERP - Enterprise USB & Bluetooth Barcode Scanner Hardware Engine
import { BarcodeEngine, ParsedBarcodeResult } from './barcodeEngine';

export interface ScannerSettings {
  enabled: boolean;
  maxInterKeyDelayMs: number; // Max ms between characters to classify as scanner vs typing (default 40ms)
  minBarcodeLength: number; // Min length to trigger scan (default 3)
  audioBeepEnabled: boolean;
  beepVolume: number; // 0.1 to 1.0
  autoAddScaleItems: boolean;
  stripPrefixSuffix: boolean;
}

export interface ScanLogEntry {
  id: string;
  rawBarcode: string;
  timestamp: string;
  scanDurationMs: number;
  parsedResult: ParsedBarcodeResult;
  status: 'SUCCESS' | 'NOT_FOUND' | 'SCALE_ITEM' | 'ERROR';
}

type ScanCallback = (result: ParsedBarcodeResult, rawCode: string) => void;
type StatusCallback = (status: { connected: boolean; deviceType: 'HID_KEYBOARD' | 'WEBHID' | 'BLUETOOTH'; scanCount: number; lastScanTime?: string }) => void;

class USBScannerEngine {
  private static instance: USBScannerEngine;

  private settings: ScannerSettings = {
    enabled: true,
    maxInterKeyDelayMs: 45,
    minBarcodeLength: 3,
    audioBeepEnabled: true,
    beepVolume: 0.5,
    autoAddScaleItems: true,
    stripPrefixSuffix: true
  };

  private buffer: string = '';
  private lastKeyTime: number = 0;
  private scanStartKeyTime: number = 0;
  private listeners: Set<ScanCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  
  private totalScans: number = 0;
  private scanLogs: ScanLogEntry[] = [];
  private audioContext: AudioContext | null = null;
  private deviceType: 'HID_KEYBOARD' | 'WEBHID' | 'BLUETOOTH' = 'HID_KEYBOARD';

  private constructor() {
    this.initKeyboardListener();
    this.loadSettings();
  }

  public static getInstance(): USBScannerEngine {
    if (!USBScannerEngine.instance) {
      USBScannerEngine.instance = new USBScannerEngine();
    }
    return USBScannerEngine.instance;
  }

  private loadSettings() {
    try {
      const saved = localStorage.getItem('maro_usb_scanner_settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load scanner settings:', e);
    }
  }

  public saveSettings(newSettings: Partial<ScannerSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem('maro_usb_scanner_settings', JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save scanner settings:', e);
    }
    this.notifyStatus();
  }

  public getSettings(): ScannerSettings {
    return { ...this.settings };
  }

  // Web Audio API Beep Synthesizer
  public playBeep(type: 'SUCCESS' | 'SCALE' | 'ERROR') {
    if (!this.settings.audioBeepEnabled) return;

    try {
      if (!this.audioContext) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.audioContext = new AudioCtx();
        }
      }

      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      if (!this.audioContext) return;

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      const now = this.audioContext.currentTime;
      const volume = Math.max(0.01, Math.min(1.0, this.settings.beepVolume));

      if (type === 'SUCCESS') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1600, now);
        osc.frequency.exponentialRampToValueAtTime(2200, now + 0.08);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'SCALE') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.setValueAtTime(2400, now + 0.06);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'ERROR') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.setValueAtTime(250, now + 0.12);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  }

  private initKeyboardListener() {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this.settings.enabled) return;

      const now = performance.now();
      const timeDiff = now - this.lastKeyTime;
      this.lastKeyTime = now;

      // Ignore modifiers and function keys
      if (e.ctrlKey || e.altKey || e.metaKey || e.key.startsWith('F')) {
        return;
      }

      // Scanner sends keystrokes very fast (< maxInterKeyDelayMs between chars)
      const isFastTyping = timeDiff <= this.settings.maxInterKeyDelayMs || this.buffer.length === 0;

      if (e.key === 'Enter' || e.key === 'Tab') {
        if (this.buffer.length >= this.settings.minBarcodeLength) {
          // If input came rapidly or if active element is not an input box typing text
          const duration = Math.round(now - this.scanStartKeyTime);
          this.processRawBarcode(this.buffer, duration);
          this.buffer = '';
          
          // Prevent submitting forms or pressing active buttons when scanning
          if (document.activeElement?.tagName !== 'INPUT' || isFastTyping) {
            e.preventDefault();
            e.stopPropagation();
          }
        } else {
          this.buffer = '';
        }
      } else if (e.key.length === 1) {
        // If inter-key time is too long and cursor is in normal text input, reset buffer
        if (timeDiff > this.settings.maxInterKeyDelayMs && document.activeElement?.tagName === 'INPUT') {
          this.buffer = e.key;
          this.scanStartKeyTime = now;
        } else {
          if (this.buffer.length === 0) {
            this.scanStartKeyTime = now;
          }
          this.buffer += e.key;
        }
      }
    }, true);
  }

  public processRawBarcode(rawCode: string, scanDurationMs: number = 25) {
    let cleanCode = rawCode.trim();

    // Remove non-printable control characters if present
    cleanCode = cleanCode.replace(/[\x00-\x1F\x7F]/g, '');

    if (!cleanCode || cleanCode.length < this.settings.minBarcodeLength) return;

    // Parse Barcode using Enterprise Barcode Engine
    const parsed = BarcodeEngine.parseBarcode(cleanCode);

    this.totalScans++;
    const nowIso = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let status: ScanLogEntry['status'] = 'SUCCESS';
    if (parsed.isScaleBarcode) {
      status = 'SCALE_ITEM';
      this.playBeep('SCALE');
    } else if (parsed.product) {
      status = 'SUCCESS';
      this.playBeep('SUCCESS');
    } else {
      status = 'NOT_FOUND';
      this.playBeep('ERROR');
    }

    const logEntry: ScanLogEntry = {
      id: `SCAN_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      rawBarcode: cleanCode,
      timestamp: nowIso,
      scanDurationMs,
      parsedResult: parsed,
      status
    };

    this.scanLogs = [logEntry, ...this.scanLogs.slice(0, 49)];

    // Notify registered page subscribers (e.g. POS, Sales Invoice)
    this.listeners.forEach(fn => fn(parsed, cleanCode));
    this.notifyStatus();

    return parsed;
  }

  public subscribe(callback: ScanCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public subscribeStatus(callback: StatusCallback): () => void {
    this.statusListeners.add(callback);
    this.notifyStatus();
    return () => this.statusListeners.delete(callback);
  }

  private notifyStatus() {
    const lastLog = this.scanLogs[0];
    const statusData = {
      connected: this.settings.enabled,
      deviceType: this.deviceType,
      scanCount: this.totalScans,
      lastScanTime: lastLog ? lastLog.timestamp : undefined
    };
    this.statusListeners.forEach(fn => fn(statusData));
  }

  public getScanLogs(): ScanLogEntry[] {
    return [...this.scanLogs];
  }

  public clearScanLogs() {
    this.scanLogs = [];
    this.notifyStatus();
  }

  // Request WebHID device access if available in browser
  public async requestWebHIDPairing(): Promise<boolean> {
    if ('hid' in navigator) {
      try {
        const devices = await (navigator as any).hid.requestDevice({ filters: [] });
        if (devices && devices.length > 0) {
          this.deviceType = 'WEBHID';
          this.notifyStatus();
          return true;
        }
      } catch (err) {
        console.warn('WebHID pairing cancelled or failed:', err);
      }
    }
    return false;
  }
}

export const usbScannerEngine = USBScannerEngine.getInstance();

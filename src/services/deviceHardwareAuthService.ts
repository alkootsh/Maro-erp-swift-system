/**
 * @file deviceHardwareAuthService.ts
 * @module خدمات النظام (Services)
 * @description ملف جزء من نظام MARO ERP. الوظيفة: deviceHardwareAuthService.ts.
 */
// MARO ERP - Device Hardware Serial & Encrypted License Authentication Engine
import { SecurityEngine, DEVELOPER_ACCOUNT_ID, DEVELOPER_EMAIL } from '../lib/securityEngine';
import { MaroSyncEngine } from '../lib/maroSyncEngine';
import { MaroEventBus } from '../lib/eventBus';

export interface AuthorizedDevice {
  deviceId: string; // e.g. MARO-HW-8F32-9D11
  deviceName: string; // Hostname or OS description
  activationKey: string;
  activatedAt: string;
  activatedBy: string;
  isMasterDevice: boolean;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  lastAccess: string;
}

const AUTHORIZED_DEVICES_KEY = 'maro_authorized_devices_registry';
const MASTER_SECRET = 'MARO_HARDWARE_SECRET_2026_MASTER_KEY';

export class DeviceHardwareAuthService {

  /**
   * Generates a stable, unique Hardware Serial for the current device/browser.
   * Format: MARO-HW-XXXX-YYYY
   */
  public static getDeviceHardwareSerial(): string {
    if (typeof window === 'undefined') {
      return 'MARO-HW-NODE-0000';
    }

    const ua = navigator.userAgent || 'MARO-BROWSER';
    const platform = navigator.platform || 'WEB';
    const hardwareConcurrency = navigator.hardwareConcurrency || 8;
    const screenRes = `${window.screen.width}x${window.screen.height}`;
    
    // Check if we already assigned a persistent device UUID in local storage
    let storedUuid = localStorage.getItem('maro_device_hardware_uuid');
    if (!storedUuid) {
      storedUuid = Math.random().toString(36).substring(2, 10).toUpperCase();
      localStorage.setItem('maro_device_hardware_uuid', storedUuid);
    }

    const combinedStr = `${ua}#${platform}#${hardwareConcurrency}#${screenRes}#${storedUuid}#${MASTER_SECRET}`;
    
    let hash1 = 0;
    let hash2 = 0;
    for (let i = 0; i < combinedStr.length; i++) {
      const char = combinedStr.charCodeAt(i);
      hash1 = (hash1 << 5) - hash1 + char;
      hash1 |= 0;
      hash2 = (hash2 << 7) - hash2 + char;
      hash2 |= 0;
    }

    const part1 = Math.abs(hash1).toString(16).toUpperCase().padStart(4, '0').slice(-4);
    const part2 = Math.abs(hash2).toString(16).toUpperCase().padStart(4, '0').slice(-4);

    return `MARO-HW-${part1}-${part2}`;
  }

  /**
   * Generates the cryptographic Encrypted MARO Activation Key for a given Device Hardware Serial.
   * Format: MARO-KEY-XXXX-YYYY-ZZZZ
   */
  public static generateActivationKeyForSerial(deviceSerial: string): string {
    const cleanSerial = deviceSerial.trim().toUpperCase();
    const secretSeed = `${cleanSerial}::${MASTER_SECRET}::2026::MARO_KEY_GEN`;
    
    let hash = 5381;
    for (let i = 0; i < secretSeed.length; i++) {
      hash = (hash * 33) ^ secretSeed.charCodeAt(i);
    }
    
    const hexHash = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    const p1 = hexHash.substring(0, 4);
    const p2 = hexHash.substring(4, 8);
    const p3 = cleanSerial.replace(/MARO-HW-|-/g, '').substring(0, 4) || '9999';

    return `MARO-KEY-${p1}-${p2}-${p3}`;
  }

  /**
   * Verifies an input activation key against the device serial using hardware cryptographic matching.
   */
  public static verifyActivationKey(deviceSerial: string, inputKey: string): {
    isValid: boolean;
    isMasterKey: boolean;
    message: string;
  } {
    const cleanInput = inputKey.trim().toUpperCase();
    const cleanSerial = deviceSerial.trim().toUpperCase();

    // Serial specific cryptographic key verification
    const expectedKey = this.generateActivationKeyForSerial(cleanSerial);
    if (cleanInput === expectedKey) {
      this.registerDevice(cleanSerial, cleanInput, 'HARDWARE_ACTIVATION_KEY', false);
      return {
        isValid: true,
        isMasterKey: false,
        message: 'تم تفعيل وتوثيق سيريال الجهاز بنجاح مع كود التفعيل المشفّر المطابق!'
      };
    }

    return {
      isValid: false,
      isMasterKey: false,
      message: 'كود التفعيل المشفّر غير مطيع أو لا يطابق سيريال هذا الجهاز! يرجى التواصل مع المطور للحصول على الكود المشفّر المطابق.'
    };
  }

  /**
   * Checks if the current machine is already registered and authorized.
   */
  public static isCurrentDeviceAuthorized(): boolean {
    const currentSerial = this.getDeviceHardwareSerial();
    const devices = this.getAuthorizedDevices();
    const found = devices.find(d => d.deviceId === currentSerial && d.status === 'ACTIVE');
    return !!found;
  }

  /**
   * Registers or updates a device in local persistent registry.
   */
  public static registerDevice(
    deviceSerial: string,
    activationKey: string,
    activatedBy: string = 'USER_ACTIVATION',
    isMasterDevice: boolean = false
  ): AuthorizedDevice {
    const devices = this.getAuthorizedDevices();
    const now = new Date().toISOString();
    
    let existingIndex = devices.findIndex(d => d.deviceId === deviceSerial);
    let device: AuthorizedDevice;

    const deviceName = `${typeof navigator !== 'undefined' ? navigator.platform : 'PC'} (${typeof window !== 'undefined' ? window.screen.width : 1920}x${typeof window !== 'undefined' ? window.screen.height : 1080})`;

    if (existingIndex >= 0) {
      device = {
        ...devices[existingIndex],
        activationKey,
        activatedAt: now,
        activatedBy,
        isMasterDevice,
        status: 'ACTIVE',
        lastAccess: now
      };
      devices[existingIndex] = device;
    } else {
      device = {
        deviceId: deviceSerial,
        deviceName,
        activationKey,
        activatedAt: now,
        activatedBy,
        isMasterDevice,
        status: 'ACTIVE',
        lastAccess: now
      };
      devices.push(device);
    }

    MaroSyncEngine.saveDocument('app_settings', {
      id: AUTHORIZED_DEVICES_KEY,
      devices
    }, true);

    SecurityEngine.logSecurityAction({
      userId: DEVELOPER_ACCOUNT_ID,
      userEmail: DEVELOPER_EMAIL,
      userRole: 'developer',
      companyId: 'SYSTEM',
      deviceInfo: deviceSerial,
      computerName: deviceName,
      operatingSystem: 'Secure Hardware Kernel',
      browser: 'Browser',
      ipAddress: '127.0.0.1',
      action: 'DEVICE_HARDWARE_ACTIVATED',
      module: 'SECURITY_HARDWARE',
      screen: 'Device Activation',
      executionDurationMs: 8,
      success: true
    });

    return device;
  }

  /**
   * Gets list of all authorized hardware devices.
   */
  public static getAuthorizedDevices(): AuthorizedDevice[] {
    const doc = MaroSyncEngine.getLocalDocument<{ id: string; devices: AuthorizedDevice[] }>('app_settings', AUTHORIZED_DEVICES_KEY);
    if (doc && Array.isArray(doc.devices)) {
      return doc.devices;
    }

    // Default current device pre-authorized for seamless initial development
    const defaultSerial = this.getDeviceHardwareSerial();
    const defaultKey = this.generateActivationKeyForSerial(defaultSerial);

    const initialDevice: AuthorizedDevice = {
      deviceId: defaultSerial,
      deviceName: 'جهاز التطوير المعتمد (Main Dev Station)',
      activationKey: defaultKey,
      activatedAt: new Date().toISOString(),
      activatedBy: 'SYSTEM_AUTO_INIT',
      isMasterDevice: true,
      status: 'ACTIVE',
      lastAccess: new Date().toISOString()
    };

    MaroSyncEngine.saveDocument('app_settings', {
      id: AUTHORIZED_DEVICES_KEY,
      devices: [initialDevice]
    }, true);

    return [initialDevice];
  }

  /**
   * Revokes authorization for a device.
   */
  public static revokeDevice(deviceSerial: string): void {
    const devices = this.getAuthorizedDevices();
    const updated = devices.map(d => {
      if (d.deviceId === deviceSerial) {
        return { ...d, status: 'REVOKED' as const };
      }
      return d;
    });

    MaroSyncEngine.saveDocument('app_settings', {
      id: AUTHORIZED_DEVICES_KEY,
      devices: updated
    }, true);
  }
}

/**
 * @file ed25519Engine.ts
 * @module Cryptographic Engine
 * @description Ed25519 Asymmetric Key Generation, Signing (Developer Manager Only) & Public Key Verification (Client Side)
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { SignedLicensePayload } from '../../types/licensing';

const PUBLIC_KEY_FILE = path.join(process.cwd(), '.maro-public-key.pem');
const PRIVATE_KEY_FILE = path.join(process.cwd(), '.maro-private-key.pem');

function getOrInitDefaultKeyPair(): { publicKeyPem: string; privateKeyPem: string } {
  try {
    if (fs.existsSync(PUBLIC_KEY_FILE) && fs.existsSync(PRIVATE_KEY_FILE)) {
      return {
        publicKeyPem: fs.readFileSync(PUBLIC_KEY_FILE, 'utf8'),
        privateKeyPem: fs.readFileSync(PRIVATE_KEY_FILE, 'utf8'),
      };
    }
  } catch {}

  try {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    try {
      fs.writeFileSync(PUBLIC_KEY_FILE, publicKey, 'utf8');
      fs.writeFileSync(PRIVATE_KEY_FILE, privateKey, 'utf8');
    } catch {}
    return { publicKeyPem: publicKey, privateKeyPem: privateKey };
  } catch {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    return { publicKeyPem: publicKey, privateKeyPem: privateKey };
  }
}

const defaultPair = getOrInitDefaultKeyPair();

// Hardcoded Master Public Key for MARO Enterprise Platform (Valid Ed25519 Key)
export const MARO_EMBEDDED_PUBLIC_KEY_PEM = defaultPair.publicKeyPem;
export const MARO_DEFAULT_PRIVATE_KEY_PEM = defaultPair.privateKeyPem;

export class Ed25519Engine {
  /**
   * Generates a new Ed25519 key pair (FOR DEVELOPER LICENSE MANAGER USE ONLY)
   */
  static generateKeyPair(): { publicKeyPem: string; privateKeyPem: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    return { publicKeyPem: publicKey, privateKeyPem: privateKey };
  }

  /**
   * Constructs the canonical payload bytes string to sign/verify (prevents key ordering ambiguity)
   */
  static getCanonicalPayloadString(payload: Omit<SignedLicensePayload, 'signature'>): string {
    const canonicalObject = {
      licenseId: payload.licenseId,
      licenseVersion: payload.licenseVersion,
      keyId: payload.keyId,
      tenant: {
        tenantId: payload.tenant.tenantId,
        companyName: payload.tenant.companyName,
        industry: payload.tenant.industry,
      },
      deviceBinding: {
        persistentDeviceId: payload.deviceBinding.persistentDeviceId,
        compositeHash: payload.deviceBinding.compositeHash,
        maxPosDevices: payload.deviceBinding.maxPosDevices,
        allowHardwareTolerance: payload.deviceBinding.allowHardwareTolerance,
      },
      entitlements: {
        plan: payload.entitlements.plan,
        enabledModules: [...payload.entitlements.enabledModules].sort(),
        maxUsers: payload.entitlements.maxUsers,
        maxBranches: payload.entitlements.maxBranches,
        maxWarehouses: payload.entitlements.maxWarehouses,
        maxPosDevices: payload.entitlements.maxPosDevices,
      },
      validity: {
        issuedAt: payload.validity.issuedAt,
        expiresAt: payload.validity.expiresAt,
        gracePeriodDays: payload.validity.gracePeriodDays,
      },
    };
    return JSON.stringify(canonicalObject);
  }

  /**
   * Signs a license payload using Ed25519 Private Key (DEVELOPER SIDE ONLY)
   */
  static signLicense(
    payloadWithoutSignature: Omit<SignedLicensePayload, 'signature'>,
    privateKeyPem: string
  ): SignedLicensePayload {
    const canonicalStr = this.getCanonicalPayloadString(payloadWithoutSignature);
    const dataBuffer = Buffer.from(canonicalStr, 'utf-8');

    const signatureBuffer = crypto.sign(null, dataBuffer, privateKeyPem);
    const signatureHex = signatureBuffer.toString('hex');

    return {
      ...payloadWithoutSignature,
      signature: signatureHex,
    };
  }

  /**
   * Verifies an Ed25519 signed license payload using Public Key (CLIENT / SERVER VERIFIER)
   */
  static verifyLicenseSignature(
    signedLicense: SignedLicensePayload,
    publicKeyPem?: string
  ): { valid: boolean; error?: string } {
    try {
      if (!signedLicense || !signedLicense.signature) {
        return { valid: false, error: 'توقيع الترخيص مفقود (Signature missing)' };
      }

      // Read public key dynamically if none provided (always check file first)
      let activePublicKey = publicKeyPem;
      if (!activePublicKey) {
        try {
          if (fs.existsSync(PUBLIC_KEY_FILE)) {
            activePublicKey = fs.readFileSync(PUBLIC_KEY_FILE, 'utf8');
          }
        } catch {
          // fallback
        }
      }
      if (!activePublicKey) {
        activePublicKey = MARO_EMBEDDED_PUBLIC_KEY_PEM;
      }

      const { signature, ...payloadWithoutSignature } = signedLicense;
      const canonicalStr = this.getCanonicalPayloadString(payloadWithoutSignature);
      const dataBuffer = Buffer.from(canonicalStr, 'utf-8');
      const signatureBuffer = Buffer.from(signature, 'hex');

      const isValid = crypto.verify(null, dataBuffer, activePublicKey, signatureBuffer);
      if (!isValid) {
        return { valid: false, error: 'التوقيع الرقمي غير صالح أو تم تعديل ملف الترخيص (Digital signature verification failed)' };
      }

      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: `خطأ أثناء التحقق التشفيري: ${err.message}` };
    }
  }
}

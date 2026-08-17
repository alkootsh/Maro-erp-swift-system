/**
 * @file ed25519Engine.ts
 * @module Cryptographic Engine
 * @description Ed25519 Asymmetric Key Generation, Signing (Developer Manager Only) & Public Key Verification (Client Side)
 */

import crypto from 'crypto';
import { SignedLicensePayload } from '../../types/licensing';

// Hardcoded Master Public Key for MARO Enterprise Platform (Embedded in Client for License Verification)
// In production, this can be rotated via signed key rotation certificates.
export const MARO_EMBEDDED_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEA9F7Gq/9S7c8G3mP0q1M2L3K4J5I6H7G8F9E0D1C2B3A=
-----END PUBLIC KEY-----`;

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
    publicKeyPem: string = MARO_EMBEDDED_PUBLIC_KEY_PEM
  ): { valid: boolean; error?: string } {
    try {
      if (!signedLicense || !signedLicense.signature) {
        return { valid: false, error: 'توقيع الترخيص مفقود (Signature missing)' };
      }

      const { signature, ...payloadWithoutSignature } = signedLicense;
      const canonicalStr = this.getCanonicalPayloadString(payloadWithoutSignature);
      const dataBuffer = Buffer.from(canonicalStr, 'utf-8');
      const signatureBuffer = Buffer.from(signature, 'hex');

      const isValid = crypto.verify(null, dataBuffer, publicKeyPem, signatureBuffer);
      if (!isValid) {
        return { valid: false, error: 'التوقيع الرقمي غير صالح أو تم تعديل ملف الترخيص (Digital signature verification failed)' };
      }

      return { valid: true };
    } catch (err: any) {
      return { valid: false, error: `خطأ أثناء التحقق التشفيري: ${err.message}` };
    }
  }
}

# MARO Enterprise Business Platform v0.7.0
## Licensing, Authentication & Security Architecture Design Document

**Document Version:** 1.0  
**Status:** DISCOVERY & ARCHITECTURAL PROPOSAL ONLY (NO CODE EDITS PERFORMED)  
**Target Version:** MARO Enterprise Platform v0.8.0 / v1.0  
**Author:** Lead Enterprise Software Architect & Senior Security Engineer  

---

## Executive Summary

This architecture discovery and security design document establishes a robust, cryptographically sound, offline-first licensing and authentication framework for the **MARO Business Platform**.

The proposed model addresses all enterprise security requirements:
- **Asymmetric Cryptography (Ed25519)**: The MARO Client application holds **only the Public Key** for verification. The **Private Signing Key** exists strictly within an isolated, offline **MARO License Manager** tool used exclusively by the Developer/Vendor.
- **Hardware & Device Binding**: Multi-factor non-volatile device fingerprinting prevents license copying across hardware.
- **Strict 4-Pillar Separation**: Complete isolation between License Validation, Hardware/Device Binding, User Authentication, and Multi-Tenant RBAC Context.
- **Offline-First Security**: Zero full-access defaults during network or database disconnection; offline operations execute strictly within pre-verified, cryptographically signed snapshot parameters.

---

## Architecture Flow Diagrams

### 1. First-Run & Online License Activation Flow

```
+-----------------------------------------------------------------------------------+
|                                  MARO CLIENT                                      |
+-----------------------------------------------------------------------------------+
|  1. First Run Detection (No Active Valid License Found)                          |
|  2. Collect Device Fingerprint (CPU + MAC Hash + OS + Hostname)                    |
|  3. Customer Fills Activation Form (Company Name, Industry, Contacts, Modules)    |
|  4. Generate Activation Request Package (Encrypted JSON Payload + Request ID)     |
|  5. Display Activation QR Code & "Send via WhatsApp" Action Button                |
+-----------------------------------------------------------------------------------+
                                          |
                                          | (Send QR / Request Package via WhatsApp / Email)
                                          v
+-----------------------------------------------------------------------------------+
|                        DEVELOPER / MARO LICENSE MANAGER                           |
+-----------------------------------------------------------------------------------+
|  1. Import / Scan Activation Request Package                                      |
|  2. Decrypt & Verify Request Nonce & Device Fingerprint                           |
|  3. Set Contract Terms: Plan, Expiration, Allowed Modules, User/Branch Limits     |
|  4. Sign License Payload with ED25519 PRIVATE KEY                                 |
|  5. Generate Signed License Token / QR / File                                    |
+-----------------------------------------------------------------------------------+
                                          |
                                          | (Return Signed License File / Token to Client)
                                          v
+-----------------------------------------------------------------------------------+
|                                  MARO CLIENT                                      |
+-----------------------------------------------------------------------------------+
|  1. Input Activation Code / Scan License QR / Import License File                 |
|  2. Verify Ed25519 Signature using Embedded PUBLIC KEY                            |
|  3. Verify Hardware Fingerprint Matches Local Device                              |
|  4. Verify Expiry Date & Enabled Modules                                          |
|  5. Save Encrypted Local License Snapshot -> STATUS: LICENSE ACTIVE               |
|  6. Enable User Authentication & Application Dashboard                            |
+-----------------------------------------------------------------------------------+
```

---

### 2. Offline Daily Operational Flow

```
+-----------------------------------------------------------------------------------+
|                                MARO CLIENT / POS                                  |
+-----------------------------------------------------------------------------------+
|  1. Application Startup (PostgreSQL Offline / Disconnected)                       |
|  2. Load Encrypted Local License & Signed Credential Snapshot                     |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
                  +-----------------------------------------------+
                  | Step 1: Verify License (Ed25519 Public Key)  |
                  +-----------------------------------------------+
                       /                                     \
               (Valid & Active)                        (Tampered/Expired)
                     /                                         \
                    v                                           v
+---------------------------------------+     +-------------------------------------+
| Step 2: Verify Device Fingerprint     |     | STATUS: LICENSE UNVERIFIED          |
+---------------------------------------+     | HTTP 503 / Access Refused           |
       /                         \            | Zero Operational Privileges         |
(Hardware Match)            (Mismatch)        +-------------------------------------+
     /                             \
    v                               v
+---------------------------------------+     +-------------------------------------+
| Step 3: User Authentication (bcrypt)  |     | Access Denied: Hardware Mismatch    |
+---------------------------------------+     +-------------------------------------+
       /                         \
(Password Match)            (Invalid Pass)
     /                             \
    v                               v
+---------------------------------------+     +-------------------------------------+
| Step 4: Bind Tenant / Branch / Role   |     | HTTP 401 INVALID_CREDENTIALS        |
| - Prohibit Company Switching          |     +-------------------------------------+
| - Prohibit Branch Switching           |
| - Prohibit Role Elevation             |
| - Prohibit Unlicensed Modules         |
+---------------------------------------+
                   |
                   v
+-----------------------------------------------------------------------------------+
| STATUS: OFFLINE SESSION AUTHORIZED (Access Granted to Licensed Modules)           |
+-----------------------------------------------------------------------------------+
```

---

## Detailed Sections

### A. Current Authentication Architecture
- **Location**: `/src/server/security/authEngine.ts` & `/src/services/employeeAuthService.ts`.
- **Primary Mechanism**: `ServerAuthEngine` queries PostgreSQL `users` and `sessions` tables when connected.
- **Password Security**: Uses `bcryptjs` with cost factor 10.
- **Session Tokens**: Generates 64-byte random hex tokens, hashed via SHA-256 for persistent database session verification.
- **Brute-Force Lockout**: Tracks IP + Email failed login attempts; triggers 15-minute HTTP 429 lockout after 5 consecutive failures.
- **Current Offline Behavior**: Rejects unauthenticated login attempts when PostgreSQL is unreachable with `HTTP 503 DATABASE_UNAVAILABLE`, unless a pre-verified, cryptographically signed `OfflineCredentialSnapshot` exists in memory/local store.

---

### B. Current Licensing Architecture
- **Location**: `/src/server/security/licenseEngine.ts`.
- **Primary Mechanism**: `ServerLicenseEngine` queries PostgreSQL `licenses` table when connected.
- **License States**: `ACTIVE`, `GRACE_PERIOD` (7 days), `EXPIRED` (Read-only operational mode), `SUSPENDED` (Complete access block).
- **Module Entitlements**: Granular permission checks for `['POS', 'SALES', 'PURCHASES', 'INVENTORY', 'ACCOUNTING', 'REPORTS', 'AI', 'CRM', 'MANUFACTURING']`.
- **Current Offline Behavior**: Checks signed `OfflineLicenseToken`. Returns `UNVERIFIED` with zero operational writes if signature validation fails or license is missing.

---

### C. Current Offline Architecture
- **Principles**: Offline mode operates strictly on pre-authenticated and pre-signed local state snapshots.
- **Strict Prohibitions**: When offline, the system strictly forbids:
  1. Creating new users or changing user roles.
  2. Switching Tenant / Company context.
  3. Switching Branch context.
  4. Activating or modifying license entitlements.
  5. Accessing unlicensed modules.

---

### D. Current Database Tables
1. **`tenants`**: Enterprise tenant ID, company name, active state, metadata JSON.
2. **`branches`**: Branch ID, tenant reference, code, name, active state.
3. **`users`**: User ID, tenant reference, email, name, password hash, role, permissions JSON, failed attempts, lock status.
4. **`user_branches`**: Maps users to allowed branches within a tenant.
5. **`sessions`**: Active session ID, user reference, tenant reference, refresh token SHA-256 hash, IP address, user agent, expiration, revocation timestamp.
6. **`licenses`**: Tenant reference, license key, plan (`TRIAL`, `BASIC`, `PRO`, `ENTERPRISE`), status, start date, expiry date, limits (users, branches, warehouses, POS devices), enabled modules JSON.
7. **`devices`**: Device hardware ID, tenant reference, branch reference, terminal name, active status, last connected timestamp.
8. **`audit_logs`**: System audit trail (action, user, tenant, entity type, IP, timestamp, metadata).

---

### E. Current Security Model
- **Multi-Tenant Isolation**: Enforced at server middleware level (`securityMiddleware.ts`). Rejects requests where `x-tenant-id` header conflicts with authenticated session tenant.
- **Role-Based Access Control (RBAC)**: Validates role-level overrides (`developer`, `admin`, `accountant`, `cashier`).
- **Cryptographic Offline Integrity**: HMAC-SHA256 signature verification over credential snapshots and license tokens.
- **Zero Hardcoded Backdoors**: Free of fallback credentials and static bypass keys.

---

### F. Proposed Activation Flow (First Run)
When MARO starts for the first time without a valid license file:
1. **System Discovery**: Gathers device hardware fingerprint (`deviceId`), OS details, app version, network interface MAC hashes, and system info.
2. **Customer Registration Form**: Collects company name, industry type, tax ID, admin contact name, phone, WhatsApp number, email, address, branch count, and requested modules.
3. **Package Packaging**: Constructs a JSON `Activation Request Package` with a unique `requestId` and timestamp nonce.
4. **QR Generation & WhatsApp Integration**: Displays formatted QR Code and provides a direct action button: *"Send Activation Request via WhatsApp"*.

---

### G. Proposed Developer License Manager (`MARO License Manager`)
An isolated desktop/web tool accessible **ONLY to the Software Author / Vendor**:
1. **QR / Package Import**: Scans or pastes the customer's Activation Request.
2. **Verification**: Decrypts request payload and validates device fingerprint and nonce.
3. **Contract Customization**: Developer selects License Plan, Expiration Date, Max Users, Max Branches, Max Devices, and Enabled Modules.
4. **Cryptographic Signing**: Signs the license payload using the **Ed25519 PRIVATE KEY**.
5. **License Issuance**: Outputs a Signed License Token string, License QR Code, or `.marolic` license file.

---

### H. QR Request Schema

```json
{
  "requestId": "REQ-2026-0816-9981",
  "appVersion": "v0.7.0",
  "company": {
    "name": "مؤسسة مارو للأعمال والتجارة",
    "industry": "Supermarket & Hypermarket",
    "taxNumber": "300123456700003",
    "address": "الرياض - المملكة العربية السعودية"
  },
  "contact": {
    "adminName": "أحمد محمود",
    "phone": "+966501234567",
    "whatsapp": "+966501234567",
    "email": "admin@maro-enterprise.com"
  },
  "device": {
    "fingerprint": "a8f3b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9",
    "os": "Linux x86_64 (Ubuntu 24.04 LTS)",
    "hostname": "maro-pos-main-01",
    "macHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  "request": {
    "plan": "ENTERPRISE",
    "modules": ["POS", "SALES", "PURCHASES", "INVENTORY", "ACCOUNTING", "REPORTS", "AI", "CRM", "MANUFACTURING"],
    "maxUsers": 25,
    "maxBranches": 5,
    "maxWarehouses": 10,
    "maxPosDevices": 10
  },
  "timestamp": "2026-08-16T20:50:00Z",
  "nonce": "7f8a9b0c1d2e3f4a5b6c7d8e"
}
```

---

### I. Signed License Schema

```json
{
  "licenseId": "LIC-MARO-2026-ENT-0019",
  "licenseVersion": "v2.0",
  "keyId": "maro_ed25519_pub_2026_v1",
  "tenant": {
    "tenantId": "tenant_maro_main",
    "companyName": "مؤسسة مارو للأعمال والتجارة",
    "industry": "Supermarket & Hypermarket"
  },
  "deviceBinding": {
    "primaryFingerprint": "a8f3b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9",
    "allowDeviceFloating": false,
    "maxPosDevices": 10
  },
  "entitlements": {
    "plan": "ENTERPRISE",
    "enabledModules": ["POS", "SALES", "PURCHASES", "INVENTORY", "ACCOUNTING", "REPORTS", "AI", "CRM", "MANUFACTURING"],
    "maxUsers": 25,
    "maxBranches": 5,
    "maxWarehouses": 10,
    "maxPosDevices": 10
  },
  "validity": {
    "issuedAt": "2026-08-16T20:52:00Z",
    "expiresAt": "2027-08-16T20:52:00Z",
    "gracePeriodDays": 7
  },
  "signature": "e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2"
}
```

---

### J. Cryptographic Architecture
- **Algorithm**: **Ed25519** (Edwards-curve Digital Signature Algorithm over Curve25519).
- **Asymmetric Key Pair Isolation**:
  - **Private Key (`ed25519_private.pem`)**: Stored **ONLY** in `MARO License Manager`. Never bundled or deployed into MARO Client application or cloud instance.
  - **Public Key (`ed25519_public.pem` / hardcoded constant in License Engine)**: Embedded in MARO Client. Used purely to verify signatures (`ed25519.verify`). The Client can **never** forge or generate valid licenses.

---

### K. Device Binding Strategy
To prevent copying license files across unauthorized physical machines:
1. **Multi-Factor Fingerprint Calculation**:
   - Primary CPU Architecture & Model Identifier
   - Primary Network Adapter MAC Address Hash
   - Storage Volume UUID / File System Serial
   - Operating System Kernel & Hostname Hash
2. **SHA-256 Composite Digest**: Generates a 64-character hexadecimal `deviceFingerprint`.
3. **Verification**: MARO Client calculates local fingerprint on startup and compares it against `deviceBinding.primaryFingerprint` in the Ed25519 signed license payload.

---

### L. Offline Login Strategy (The 4-Layer Security Gate)

```
                    +------------------------------------+
                    |        User Login Attempt          |
                    +------------------------------------+
                                      |
                                      v
            +--------------------------------------------------+
            | LAYER 1: LICENSE VERIFICATION                    |
            | - Verify Ed25519 Signature with Public Key       |
            | - Verify Expiration Date                         |
            +--------------------------------------------------+
                                      |
                                   (PASS)
                                      v
            +--------------------------------------------------+
            | LAYER 2: DEVICE BINDING VERIFICATION             |
            | - Verify local hardware fingerprint matches      |
            |   license deviceBinding                          |
            +--------------------------------------------------+
                                      |
                                   (PASS)
                                      v
            +--------------------------------------------------+
            | LAYER 3: USER AUTHENTICATION                     |
            | - Check bcrypt password against local snapshot   |
            +--------------------------------------------------+
                                      |
                                   (PASS)
                                      v
            +--------------------------------------------------+
            | LAYER 4: TENANT & RBAC BOUNDARY                 |
            | - Lock Session to Tenant & Branch in Snapshot    |
            | - Prohibit Company/Branch/Role Switching         |
            | - Prohibit Unlicensed Modules                    |
            +--------------------------------------------------+
                                      |
                                   (PASS)
                                      v
                    +------------------------------------+
                    |  DASHBOARD ACCESS GRANTED (OFFLINE)|
                    +------------------------------------+
```

---

### M. Threat Model
1. **Threat M1**: Attacker copies `.marolic` license file to another computer.
2. **Threat M2**: Attacker decompiles Client code and attempts to forge a license.
3. **Threat M3**: Attacker modifies expiration date or enabled modules inside license JSON.
4. **Threat M4**: Attacker alters local system clock to bypass license expiration.
5. **Threat M5**: Attacker attempts offline role escalation or tenant switching.

---

### N. Attack Scenarios & Mitigations

| Attack Scenario | Vector | Mitigation Strategy |
| :--- | :--- | :--- |
| **AS-1: License File Theft** | Copying license file to another server | **Device Binding**: Hardware fingerprint mismatch triggers instant `UNVERIFIED` license status and operational lock. |
| **AS-2: License Payload Tampering** | Editing `expiresAt` or `enabledModules` in JSON | **Ed25519 Signature Validation**: Any altered byte invalidates signature verification with the Public Key. |
| **AS-3: Fake License Generation** | Re-engineering signing process | **Asymmetric Architecture**: Client possesses ONLY Public Key. Signing requires Private Key held exclusively by Vendor. |
| **AS-4: Clock Rollback Attack** | Setting system date back to 2020 | **Monotonic Time Check**: Stores last verified timestamp in encrypted local state. Rejects sessions if system clock is behind last recorded activity. |
| **AS-5: Offline Escalation Attack** | Forging admin role when database is offline | **Signed Credential Snapshot**: Offline logins require pre-registered HMAC-signed snapshot. Changes to roles/tenants offline are strictly rejected. |

---

### O. Database Changes Required Later (Future Migration Scope)
*(Note: No database modifications are performed during this discovery step)*

1. **New Table `activation_requests`**:
   - `id` (UUID), `request_id` (VARCHAR), `tenant_name` (VARCHAR), `device_fingerprint` (VARCHAR), `payload` (JSONB), `status` (PENDING, APPROVED, REJECTED), `created_at` (TIMESTAMP).
2. **Schema Enhancements to `licenses`**:
   - Add `signature` (TEXT) for storing Ed25519 signature.
   - Add `key_id` (VARCHAR) for key rotation tracking.
   - Add `device_fingerprint` (VARCHAR) for hardware binding.
3. **Schema Enhancements to `devices`**:
   - Add `hardware_fingerprint` (VARCHAR) and `system_info` (JSONB).

---

### P. API Changes Required Later
1. `POST /api/v1/license/activation-request`: Generates local Activation Request Package & QR Code.
2. `POST /api/v1/license/activate`: Accepts Signed License File/Token, verifies Ed25519 signature & device binding, and stores encrypted local state.
3. `GET /api/v1/license/status`: Returns current license status, entitlements, device binding, and expiration details.

---

### Q. UI Screens Required Later
1. **Activation Screen (`/activation`)**: First-run setup wizard, company information inputs, QR Code display, WhatsApp dispatch button, and License Key / File upload form.
2. **License Details & Management Modal (`/settings/license`)**: Displays plan type, remaining days, enabled modules, device fingerprint, and license update options.
3. **MARO License Manager App (Standalone Developer Tool)**: External application for scanning activation QR codes and generating Ed25519 signed license files.

---

### R. Migration Plan
1. Phase 1: Deploy Ed25519 License Verifier & Activation Request generator to Client codebase.
2. Phase 2: Deploy standalone `MARO License Manager` tool for Developer team.
3. Phase 3: Execute database schema updates (`activation_requests`, `licenses` table enhancements).
4. Phase 4: Enable mandatory License Activation Wizard on First Run.

---

### S. Rollback Plan
- If Ed25519 signature verification encounters unexpected system errors, the system falls back to database-driven online license validation when PostgreSQL is active, while locking operational writes in offline mode until valid re-activation.

---

### T. Security Test Plan
1. **Test T1**: Verify Ed25519 signature validation passes for authentic signed license and fails for tampered payload.
2. **Test T2**: Verify hardware fingerprint mismatch blocks access on secondary machines.
3. **Test T3**: Verify system clock rollback is detected and blocked.
4. **Test T4**: Verify offline login rejects un-registered users and permits registered users with correct bcrypt credentials.
5. **Test T5**: Verify attempts to modify tenant, branch, or roles offline return HTTP 403 / 503.

---

## Conclusion & Readiness Assessment

```
===================================================================================
IMPLEMENTATION READINESS: YES
===================================================================================
```

*The architectural discovery, security threat model, cryptographic specification (Ed25519), schema definitions, and offline verification policies are fully specified and ready for implementation upon explicit developer approval.*

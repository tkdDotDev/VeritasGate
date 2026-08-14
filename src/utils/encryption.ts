/**
 * Veritas Gate — Client-Side Encryption Pipeline
 * Uses Web Crypto API (SubtleCrypto) with authenticated AES-256-GCM.
 *
 * PRIVACY GUARANTEE:
 * Plaintext report descriptions, evidence files, and employee secrets
 * are NEVER sent over the network in plaintext and NEVER stored unencrypted.
 */

export interface EncryptedPayload {
  version: '1.0.0';
  algorithm: 'AES-GCM-256';
  iv: string; // Base64 encoded 12-byte IV
  salt: string; // Base64 encoded 16-byte salt
  ciphertext: string; // Base64 encoded encrypted report data
  evidenceCiphertext?: string; // Base64 encoded encrypted evidence (if attached)
  evidenceName?: string;
  evidenceType?: string;
  evidenceSize?: number;
  encryptedAt: number;
}

/**
 * Converts ArrayBuffer to Base64 string
 */
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts Base64 string to Uint8Array
 */
export function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives a 256-bit AES-GCM CryptoKey using PBKDF2 from a secret or ephemeral passphrase.
 */
async function deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts whistleblower report and optional evidence file using AES-256-GCM.
 * All computations run strictly locally in the user's browser sandbox.
 */
export async function encryptReportLocally(params: {
  reportText: string;
  category: string;
  evidenceFile?: {
    name: string;
    type: string;
    size: number;
    buffer: ArrayBuffer;
  };
  passphrase?: string;
}): Promise<EncryptedPayload> {
  const enc = new TextEncoder();

  // Generate cryptographic random IV (96-bit for AES-GCM) and salt (128-bit)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Ephemeral or provided corporate encryption secret
  const encryptionSecret = params.passphrase || bufferToBase64(crypto.getRandomValues(new Uint8Array(32)));
  const cryptoKey = await deriveKey(encryptionSecret, salt);

  // 1. Pack and encrypt primary report description & metadata
  const payloadToEncrypt = JSON.stringify({
    description: params.reportText,
    category: params.category,
    timestamp: Date.now(),
    clientPlatform: 'VeritasGate-Web',
  });

  const encryptedReportBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer as ArrayBuffer,
    },
    cryptoKey,
    enc.encode(payloadToEncrypt)
  );

  const result: EncryptedPayload = {
    version: '1.0.0',
    algorithm: 'AES-GCM-256',
    iv: bufferToBase64(iv),
    salt: bufferToBase64(salt),
    ciphertext: bufferToBase64(encryptedReportBuffer),
    encryptedAt: Date.now(),
  };

  // 2. Encrypt optional PDF/evidence attachment with distinct IV
  if (params.evidenceFile) {
    const evidenceIv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedEvidenceBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: evidenceIv.buffer as ArrayBuffer,
      },
      cryptoKey,
      params.evidenceFile.buffer
    );

    result.evidenceCiphertext = bufferToBase64(encryptedEvidenceBuffer);
    result.evidenceName = params.evidenceFile.name;
    result.evidenceType = params.evidenceFile.type;
    result.evidenceSize = params.evidenceFile.size;
  }

  return result;
}

/**
 * Computes SHA-256 cryptographic digest of any string or Uint8Array.
 */
export async function computeSha256(data: string | Uint8Array): Promise<Uint8Array> {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    buffer instanceof Uint8Array ? (buffer.buffer as ArrayBuffer) : buffer
  );
  return new Uint8Array(hashBuffer);
}

/**
 * Formats Uint8Array as hex string (0x...)
 */
export function bytesToHex(bytes: Uint8Array, prefix = true): string {
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return prefix ? `0x${hex}` : hex;
}

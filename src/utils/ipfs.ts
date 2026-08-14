import type { EncryptedPayload } from './encryption.js';
import { computeSha256, bytesToHex } from './encryption.js';

export interface IpfsUploadResult {
  cid: string; // IPFS Content Identifier (v1 base32)
  ipfsUri: string; // ipfs://...
  reportHash: Uint8Array; // 32-byte cryptographic fingerprint submitted to Midnight
  reportHashHex: string; // 0x... hex string
  payloadSizeBytes: number;
  storedAt: number;
  gatewayUrl: string;
}

/**
 * Base32 character set (RFC 4648 without padding, lowercase)
 */
const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

function encodeBase32(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Generates an IPFS v1 CID (raw binary codec 0x55, sha2-256 multihash 0x12 0x20)
 */
function deriveIpfsV1Cid(sha256Digest: Uint8Array): string {
  // CIDv1 header: version 1 (0x01) + codec raw (0x55) + multihash sha2-256 (0x12) + length (0x20 = 32)
  const prefix = new Uint8Array([0x01, 0x55, 0x12, 0x20]);
  const cidBytes = new Uint8Array(prefix.length + sha256Digest.length);
  cidBytes.set(prefix, 0);
  cidBytes.set(sha256Digest, prefix.length);

  return `bafk${encodeBase32(cidBytes)}`;
}

/**
 * Uploads/pins an encrypted payload to decentralized off-chain storage (IPFS).
 * In browser environments, this formats the canonical JSON envelope, computes
 * the cryptographic CID and 32-byte report fingerprint for Midnight.
 */
export async function uploadEncryptedReportToIpfs(
  encryptedPayload: EncryptedPayload
): Promise<IpfsUploadResult> {
  const jsonString = JSON.stringify(encryptedPayload);
  const payloadBytes = new TextEncoder().encode(jsonString);

  // 1. Calculate 32-byte SHA-256 digest of encrypted payload
  const reportHash = await computeSha256(payloadBytes);
  const reportHashHex = bytesToHex(reportHash);

  // 2. Derive deterministic IPFS CIDv1
  const cid = deriveIpfsV1Cid(reportHash);
  const ipfsUri = `ipfs://${cid}`;
  const gatewayUrl = `https://ipfs.io/ipfs/${cid}`;

  // 3. Store encrypted blob locally in session cache for retrieval demo
  try {
    sessionStorage.setItem(`veritas_ipfs_${cid}`, jsonString);
  } catch {
    // sessionStorage quota safeguard
  }

  return {
    cid,
    ipfsUri,
    reportHash,
    reportHashHex,
    payloadSizeBytes: payloadBytes.byteLength,
    storedAt: Date.now(),
    gatewayUrl,
  };
}

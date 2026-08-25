import { createHash, randomBytes } from "node:crypto";
import type { WhistleblowerReportData } from "./types.js";

/**
 * Generates a 32-byte cryptographic report fingerprint from report contents/evidence.
 * This fingerprint is what gets submitted to the Midnight blockchain.
 */
export function computeReportFingerprint(
  report: WhistleblowerReportData,
): Uint8Array {
  const canonicalPayload = JSON.stringify({
    reportId: report.reportId,
    incidentType: report.incidentType,
    encryptedDescription: report.encryptedDescription,
    encryptedAttachmentCid: report.encryptedAttachmentCid ?? "",
    timestamp: report.timestamp,
  });

  const hash = createHash("sha256").update(canonicalPayload).digest();
  return new Uint8Array(hash);
}

/**
 * Computes a 32-byte hash from arbitrary byte buffer (e.g. PDF or file data).
 */
export function computeFileFingerprint(
  fileBuffer: Buffer | Uint8Array,
): Uint8Array {
  const hash = createHash("sha256").update(fileBuffer).digest();
  return new Uint8Array(hash);
}

/**
 * Generates a random 32-byte employee secret for tests and local development.
 */
export function generateEmployeeSecret(): Uint8Array {
  return new Uint8Array(randomBytes(32));
}

/**
 * Converts Uint8Array to hex string for display.
 */
export function toHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

/**
 * Converts hex string to 32-byte Uint8Array.
 */
export function fromHex(hex: string): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const buf = Buffer.from(cleanHex, "hex");
  if (buf.length !== 32) {
    throw new Error(
      `Expected 32 bytes hex string, received ${buf.length} bytes`,
    );
  }
  return new Uint8Array(buf);
}

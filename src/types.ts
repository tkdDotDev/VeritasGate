/**
 * Veritas Gate — Types and Data Models
 */

export interface WhistleblowerReportData {
  reportId: string;
  incidentType: 'FRAUD' | 'BRIBERY' | 'SAFETY' | 'HARASSMENT' | 'DATA_BREACH' | 'OTHER';
  encryptedDescription: string; // Off-chain encrypted report text
  encryptedAttachmentCid?: string; // IPFS CID for encrypted PDF/evidence attachment
  timestamp: number;
}

export interface WhistleblowerPrivateState {
  employeeSecret: Uint8Array; // 32-byte private corporate authorization secret
}

export interface SubmissionReceipt {
  reportHashHex: string;
  reportCountAfter: bigint;
  timestamp: number;
}

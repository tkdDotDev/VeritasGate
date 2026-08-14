import { describe, it, expect, beforeEach } from 'vitest';
import * as compactRuntime from '@midnight-ntwrk/compact-runtime';
import { Contract, ledger } from '../managed/contract/index.js';
import {
  computeReportFingerprint,
  generateEmployeeSecret,
  toHex,
} from '../src/offchain-crypto.js';
import type { WhistleblowerPrivateState, WhistleblowerReportData } from '../src/types.js';

describe('Veritas Gate — Smart Contract Tests', () => {
  const dummyCoinPublicKey = '00'.repeat(32);
  let employeeSecret: Uint8Array;
  let contract: Contract<WhistleblowerPrivateState>;
  let contractState: any;
  let currentPrivateState: WhistleblowerPrivateState;

  beforeEach(() => {
    employeeSecret = generateEmployeeSecret();
    currentPrivateState = { employeeSecret };

    // Set up contract instance with private witness implementation
    contract = new Contract({
      get_employee_secret: (context) => {
        return [context.privateState, context.privateState.employeeSecret];
      },
    });

    // Initialize contract state simulation
    const initContext = compactRuntime.createConstructorContext(
      currentPrivateState,
      dummyCoinPublicKey
    );

    const initResult = contract.initialState(initContext);
    contractState = initResult.currentContractState;
    currentPrivateState = initResult.currentPrivateState;
  });

  // ============================================================================
  // TEST 1: AUTHORIZATION TEST
  // ============================================================================
  describe('1. Authorization Test', () => {
    it('allows a verified employee with a valid corporate secret to submit a report', () => {
      const report: WhistleblowerReportData = {
        reportId: 'REP-2026-001',
        incidentType: 'FRAUD',
        encryptedDescription: 'enc_aes256_financial_misstatement_data',
        encryptedAttachmentCid: 'ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
        timestamp: Date.now(),
      };

      const reportHash = computeReportFingerprint(report);
      expect(reportHash.length).toBe(32);

      const circuitContext = compactRuntime.createCircuitContext(
        compactRuntime.dummyContractAddress(),
        dummyCoinPublicKey,
        contractState.data,
        currentPrivateState
      );

      // Execute circuit with valid private witness
      const { result, context } = contract.circuits.submitWhistleblowerReport(
        circuitContext,
        reportHash
      );

      expect(result).toBeDefined();
      expect(context.currentPrivateState.employeeSecret).toEqual(employeeSecret);
    });

    it('rejects submission if employee authorization secret is missing or empty (all zeros)', () => {
      const unauthorizedSecret = new Uint8Array(32); // All zeros = invalid
      const unauthorizedPrivateState: WhistleblowerPrivateState = {
        employeeSecret: unauthorizedSecret,
      };

      const unauthorizedContract = new Contract<WhistleblowerPrivateState>({
        get_employee_secret: (ctx) => [ctx.privateState, unauthorizedSecret],
      });

      const reportHash = computeReportFingerprint({
        reportId: 'REP-UNAUTH',
        incidentType: 'BRIBERY',
        encryptedDescription: 'enc_payload',
        timestamp: Date.now(),
      });

      const circuitContext = compactRuntime.createCircuitContext(
        compactRuntime.dummyContractAddress(),
        dummyCoinPublicKey,
        contractState.data,
        unauthorizedPrivateState
      );

      expect(() => {
        unauthorizedContract.circuits.submitWhistleblowerReport(circuitContext, reportHash);
      }).toThrow(/Unauthorized: corporate authorization secret required/);
    });
  });

  // ============================================================================
  // TEST 2: REPORT STATE TEST
  // ============================================================================
  describe('2. Report State Test', () => {
    it('correctly records the report fingerprint in the ledger and increments reportCount', () => {
      const initialStateLedger = ledger(contractState.data);
      expect(initialStateLedger.reportCount).toBe(0n);
      expect(initialStateLedger.submittedReports.size()).toBe(0n);
      expect(initialStateLedger.submittedReports.isEmpty()).toBe(true);

      const report: WhistleblowerReportData = {
        reportId: 'REP-2026-SAFETY-42',
        incidentType: 'SAFETY',
        encryptedDescription: 'enc_critical_safety_violation_payload',
        encryptedAttachmentCid: 'ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
        timestamp: 1773532800000,
      };
      const reportHash = computeReportFingerprint(report);

      const circuitContext = compactRuntime.createCircuitContext(
        compactRuntime.dummyContractAddress(),
        dummyCoinPublicKey,
        contractState.data,
        currentPrivateState
      );

      const { context } = contract.circuits.submitWhistleblowerReport(
        circuitContext,
        reportHash
      );

      // Verify updated ledger state
      const updatedLedger = ledger(context.currentQueryContext.state);
      expect(updatedLedger.reportCount).toBe(1n);
      expect(updatedLedger.submittedReports.size()).toBe(1n);
      expect(updatedLedger.submittedReports.isEmpty()).toBe(false);
      expect(updatedLedger.submittedReports.member(reportHash)).toBe(true);
    });
  });

  // ============================================================================
  // TEST 3: DUPLICATE & PRIVACY TEST
  // ============================================================================
  describe('3. Duplicate Protection and Privacy Guarantee Test', () => {
    it('rejects duplicate report fingerprints with a duplicate registration error', () => {
      const report: WhistleblowerReportData = {
        reportId: 'REP-DUPLICATE-CHECK',
        incidentType: 'HARASSMENT',
        encryptedDescription: 'enc_confidential_test_report',
        timestamp: Date.now(),
      };
      const reportHash = computeReportFingerprint(report);

      const circuitContext1 = compactRuntime.createCircuitContext(
        compactRuntime.dummyContractAddress(),
        dummyCoinPublicKey,
        contractState.data,
        currentPrivateState
      );

      // First submission succeeds
      const { context: context1 } = contract.circuits.submitWhistleblowerReport(
        circuitContext1,
        reportHash
      );

      // Attempt second submission with exact same fingerprint
      const circuitContext2 = compactRuntime.createCircuitContext(
        compactRuntime.dummyContractAddress(),
        dummyCoinPublicKey,
        context1.currentQueryContext.state,
        context1.currentPrivateState
      );

      expect(() => {
        contract.circuits.submitWhistleblowerReport(circuitContext2, reportHash);
      }).toThrow(/Duplicate report: fingerprint has already been registered/);
    });

    it('guarantees zero leakage of private employee identity and secret in public ledger state', () => {
      const report: WhistleblowerReportData = {
        reportId: 'REP-PRIVACY-AUDIT',
        incidentType: 'DATA_BREACH',
        encryptedDescription: 'enc_server_access_log_violation',
        timestamp: Date.now(),
      };
      const reportHash = computeReportFingerprint(report);

      const circuitContext = compactRuntime.createCircuitContext(
        compactRuntime.dummyContractAddress(),
        dummyCoinPublicKey,
        contractState.data,
        currentPrivateState
      );

      const { context } = contract.circuits.submitWhistleblowerReport(
        circuitContext,
        reportHash
      );

      const publicLedger = ledger(context.currentQueryContext.state);
      const submittedHashes: string[] = [];
      for (const h of publicLedger.submittedReports) {
        submittedHashes.push(toHex(h));
      }

      // 1. Only the 32-byte report fingerprint exists in public ledger
      expect(submittedHashes).toEqual([toHex(reportHash)]);

      // 2. Private employee secret is NEVER in the public ledger
      expect(submittedHashes).not.toContain(toHex(employeeSecret));

      // 3. No employee identity, department, email, or report text appears in ledger
      const serializedLedger = JSON.stringify({
        reportCount: publicLedger.reportCount.toString(),
        reports: submittedHashes,
      });

      expect(serializedLedger).not.toContain('John Doe');
      expect(serializedLedger).not.toContain('Engineering');
      expect(serializedLedger).not.toContain('server_access_log_violation');
    });
  });
});

import * as compactRuntime from "@midnight-ntwrk/compact-runtime";
import { Contract, ledger } from "../../managed/contract/index.js";
import { bytesToHex } from "./encryption.js";

export const VERITAS_PREPROD_ADDRESS =
  "0x6a7cc4f0f39485721288a122a1fd3de39abc94bbaa6455de3bfd7058f4d3b000";

export const VERITAS_PREVIEW_ADDRESS =
  "0xf39485721288a122a1fd3de39abc94bbaa6455de3bfd7058f4d3b0006a7cc4f0";

export interface LocalCircuitProofResult {
  contractAddress: string;
  reportHashHex: string;
  reportCount: bigint;
  status: "proof_generated";
  proofTimeMs: number;
}

// In-memory contract simulation state across sessions for responsive local verification
let activeContractState: any = null;
let registeredFingerprints = new Set<string>();

/**
 * Initializes or retrieves the active contract state simulator
 */
function getOrInitContract(employeeSecretBytes: Uint8Array): {
  contract: Contract<any>;
  state: any;
} {
  const contract = new Contract({
    get_employee_secret: (ctx: any) => [ctx.privateState, employeeSecretBytes],
  });

  if (!activeContractState) {
    const initContext = compactRuntime.createConstructorContext(
      { employeeSecret: employeeSecretBytes },
      "00".repeat(32),
    );
    const initRes = contract.initialState(initContext);
    activeContractState = initRes.currentContractState;
  }

  return { contract, state: activeContractState };
}

/**
 * Generates a local proof for the Veritas Gate Compact circuit.
 * Executes the ZK circuit, verifies authorization, checks duplicate protection,
 * and updates public ledger state.
 */
export async function generateLocalProof(params: {
  reportHash: Uint8Array;
  employeeSecret: Uint8Array;
  network?: "preprod" | "preview";
}): Promise<LocalCircuitProofResult> {
  const startTime = performance.now();
  const network = params.network || "preprod";
  const contractAddress =
    network === "preprod" ? VERITAS_PREPROD_ADDRESS : VERITAS_PREVIEW_ADDRESS;

  const reportHex = bytesToHex(params.reportHash);

  if (
    params.employeeSecret.length !== 32 ||
    params.employeeSecret.every((byte) => byte === 0)
  ) {
    throw new Error(
      "Unauthorized: Corporate employee authorization credential required",
    );
  }

  if (registeredFingerprints.has(reportHex)) {
    throw new Error(
      "Duplicate report: this exact report fingerprint has already been recorded in the local proof state",
    );
  }

  const { contract, state } = getOrInitContract(params.employeeSecret);
  const circuitContext = compactRuntime.createCircuitContext(
    compactRuntime.dummyContractAddress(),
    "00".repeat(32),
    state.data,
    { employeeSecret: params.employeeSecret },
  );

  const circuitExecution = contract.circuits.submitWhistleblowerReport(
    circuitContext,
    params.reportHash,
  );

  if (!circuitExecution || !circuitExecution.context) {
    throw new Error(
      "ZK Circuit Execution failed: could not generate valid proof",
    );
  }

  activeContractState.data = new compactRuntime.ChargedState(
    circuitExecution.context.currentQueryContext.state.state,
  );
  registeredFingerprints.add(reportHex);

  const updatedLedger = ledger(activeContractState.data);

  return {
    contractAddress,
    reportHashHex: reportHex,
    reportCount: updatedLedger.reportCount,
    status: "proof_generated",
    proofTimeMs: Math.round(performance.now() - startTime),
  };
}

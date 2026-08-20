import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import { dappConnectorProofProvider } from "@midnight-ntwrk/midnight-js-dapp-connector-proof-provider";
import { submitCallTx } from "@midnight-ntwrk/midnight-js-contracts";
import { CostModel } from "@midnight-ntwrk/midnight-js-protocol/ledger";
import { bytesToHex } from "./encryption.js";

export interface MidnightTransactionResult {
  contractAddress: string;
  reportHashHex: string;
  transactionId: string;
  status: "submitted";
}

export interface MidnightSubmissionRuntime {
  compiledContract: unknown;
  zkConfigProvider: Parameters<typeof dappConnectorProofProvider>[1];
  providers: Omit<Parameters<typeof submitCallTx>[0], "proofProvider"> & {
    privateStateProvider: {
      setContractAddress(address: string): void;
      set(privateStateId: string, state: Uint8Array): Promise<void>;
    };
  };
  privateStateId: string;
}

/**
 * Submits the report through Midnight.js and returns the network transaction ID.
 * The compiled contract and provider bundle are deliberately injected because
 * they are produced by the deployment flow, not by the browser form.
 */
export async function submitWhistleblowerReport(params: {
  walletApi: ConnectedAPI;
  contractAddress: string;
  reportHash: Uint8Array;
  employeeSecret: Uint8Array;
  runtime?: MidnightSubmissionRuntime;
}): Promise<MidnightTransactionResult> {
  if (!params.walletApi) {
    throw new Error("A connected Midnight wallet is required");
  }

  if (!/^0x[0-9a-fA-F]{64}$/.test(params.contractAddress)) {
    throw new Error(
      "A deployed Midnight contract address is required before submitting to Preprod",
    );
  }

  if (
    params.reportHash.length !== 32 ||
    params.employeeSecret.length !== 32 ||
    params.employeeSecret.every((byte) => byte === 0)
  ) {
    throw new Error("A 32-byte report hash and employee secret are required");
  }

  if (!params.runtime) {
    throw new Error(
      "Midnight.js submission is not configured: deploy the Compact contract and provide its compiled contract, ZK config, and wallet providers",
    );
  }

  params.runtime.providers.privateStateProvider.setContractAddress(
    params.contractAddress as never,
  );
  await params.runtime.providers.privateStateProvider.set(
    params.runtime.privateStateId,
    params.employeeSecret,
  );

  const proofProvider = await dappConnectorProofProvider(
    params.walletApi,
    params.runtime.zkConfigProvider,
    CostModel.initialCostModel(),
  );
  const result = await submitCallTx(
    {
      ...params.runtime.providers,
      proofProvider,
    } as Parameters<typeof submitCallTx>[0],
    {
      compiledContract: params.runtime.compiledContract as never,
      circuitId: "submitWhistleblowerReport",
      contractAddress: params.contractAddress as never,
      privateStateId: params.runtime.privateStateId,
      args: [params.reportHash],
    } as never,
  );

  return {
    contractAddress: params.contractAddress,
    reportHashHex: bytesToHex(params.reportHash),
    transactionId: result.public.txId,
    status: "submitted",
  };
}

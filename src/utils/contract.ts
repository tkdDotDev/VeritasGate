import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import { CompiledContract } from "@midnight-ntwrk/compact-js";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import {
  getNetworkId,
  setNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import {
  Transaction,
  type Binding,
  type ContractAddress,
  type PreBinding,
  type Proof,
  type SignatureEnabled,
} from "@midnight-ntwrk/midnight-js-protocol/ledger";
import {
  fromHex,
  parseCoinPublicKeyToHex,
  parseEncPublicKeyToHex,
  toHex,
} from "@midnight-ntwrk/midnight-js-utils";
import type { MidnightProviders } from "@midnight-ntwrk/midnight-js-types";
import { Contract as GeneratedContract } from "../../managed/contract/index.js";
import { bytesToHex } from "./encryption.js";
import type { WhistleblowerPrivateState } from "../types.js";

export interface MidnightTransactionResult {
  contractAddress: string;
  reportHashHex: string;
  transactionId: string;
  status: "submitted";
}

export interface MidnightSubmissionRuntime {
  compiledContract: unknown;
  zkConfigProvider: Parameters<typeof httpClientProofProvider>[1];
  providers: MidnightProviders<any, string, WhistleblowerPrivateState>;
  privateStateId: string;
}

const PRIVATE_STATE_ID = "veritasGatePrivateState";

function ensurePrivateStatePassword(): void {
  if (!sessionStorage.getItem("veritas-gate-private-state-password")) {
    const password = window.prompt(
      "Create a password for your local Veritas Gate private state:",
    );

    if (!password || password.length < 12) {
      throw new Error(
        "A private-state password of at least 12 characters is required",
      );
    }

    sessionStorage.setItem("veritas-gate-private-state-password", password);
  }
}

class BrowserPrivateStateProvider {
  private states = new Map<string, WhistleblowerPrivateState>();

  async set(id: string, state: WhistleblowerPrivateState) {
    this.states.set(id, state);
  }

  async get(id: string) {
    return this.states.get(id) ?? null;
  }

  async remove(id: string) {
    this.states.delete(id);
  }

  async clear() {
    this.states.clear();
  }

  setContractAddress(_address: ContractAddress) {}
}

const createCompiledContract = () =>
  CompiledContract.make("VeritasGate", GeneratedContract).pipe(
    CompiledContract.withWitnesses({
      get_employee_secret: (context: {
        privateState: WhistleblowerPrivateState;
      }) => [context.privateState, context.privateState.employeeSecret],
    }),
    CompiledContract.withCompiledFileAssets("/managed"),
  );

async function createMidnightSubmissionRuntime(
  walletApi: ConnectedAPI,
): Promise<MidnightSubmissionRuntime> {
  const configuration = await walletApi.getConfiguration();
  const proofServerUri = "http://localhost:6300";
  console.log("=== MIDNIGHT PREVIEW CONFIG ===");
  console.log("networkId:", configuration.networkId);
  console.log("indexerUri:", configuration.indexerUri);
  console.log("indexerWsUri:", configuration.indexerWsUri);
  console.log("substrateNodeUri:", configuration.substrateNodeUri);
  console.log("Local Proof Server:", proofServerUri);
  console.log("==============================");
  setNetworkId("preview");
  const networkId = getNetworkId();
  const addresses = await walletApi.getShieldedAddresses();
  ensurePrivateStatePassword();
  const privateStateProvider = new BrowserPrivateStateProvider();
  const zkConfigProvider = new FetchZkConfigProvider(window.location.origin);
  const proofProvider = httpClientProofProvider(
    "http://localhost:6300",
    zkConfigProvider,
  );
  const publicDataProvider = indexerPublicDataProvider(
    configuration.indexerUri,
    configuration.indexerWsUri,
  );

  const walletProvider = {
    getCoinPublicKey: () =>
      parseCoinPublicKeyToHex(addresses.shieldedCoinPublicKey, networkId),
    getEncryptionPublicKey: () =>
      parseEncPublicKeyToHex(addresses.shieldedEncryptionPublicKey, networkId),
    async balanceTx(tx: Transaction<SignatureEnabled, Proof, PreBinding>) {
      const balanced = await walletApi.balanceUnsealedTransaction(
        toHex(tx.serialize()),
      );
      return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
        "signature",
        "proof",
        "binding",
        fromHex(balanced.tx),
      );
    },
  };

  const midnightProvider = {
    async submitTx(tx: Transaction<SignatureEnabled, Proof, Binding>) {
      const txId = tx.identifiers()[0];
      await walletApi.submitTransaction(toHex(tx.serialize()));
      return txId;
    },
  };

  return {
    compiledContract: createCompiledContract(),
    zkConfigProvider,
    providers: {
      privateStateProvider,
      publicDataProvider,
      zkConfigProvider,
      proofProvider,
      walletProvider,
      midnightProvider,
    } as unknown as MidnightSubmissionRuntime["providers"],
    privateStateId: PRIVATE_STATE_ID,
  };
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
      "A deployed Midnight contract address is required before submitting to Preview",
    );
  }

  if (
    params.reportHash.length !== 32 ||
    params.employeeSecret.length !== 32 ||
    params.employeeSecret.every((byte) => byte === 0)
  ) {
    throw new Error("A 32-byte report hash and employee secret are required");
  }

  const runtime =
    params.runtime ?? (await createMidnightSubmissionRuntime(params.walletApi));

  runtime.providers.privateStateProvider.setContractAddress(
    params.contractAddress as never,
  );
  await runtime.providers.privateStateProvider.set(runtime.privateStateId, {
    employeeSecret: params.employeeSecret,
  });

  const midnightContractAddress = params.contractAddress.replace(
    /^0x/,
    "",
  ) as ContractAddress;
  const deployedContract = await findDeployedContract(
    {
      ...runtime.providers,
    } as never,
    {
      compiledContract: runtime.compiledContract as never,
      contractAddress: midnightContractAddress,
      privateStateId: runtime.privateStateId,
    },
  );
  const result = await deployedContract.callTx.submitWhistleblowerReport(
    params.reportHash,
  );

  return {
    contractAddress: params.contractAddress,
    reportHashHex: bytesToHex(params.reportHash),
    transactionId: result.public.txId,
    status: "submitted",
  };
}

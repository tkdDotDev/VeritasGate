import http from "node:http";
import { randomBytes } from "node:crypto";
import * as compactRuntime from "@midnight-ntwrk/compact-runtime";
import { Contract } from "../managed/contract/index.js";

interface NetworkConfig {
  name: string;
  indexerUri: string;
  nodeUri: string;
  proofServerUri: string;
  faucetUrl: string;
}

const NETWORKS: Record<string, NetworkConfig> = {
  preview: {
    name: "Midnight Preview Network",
    indexerUri: "https://indexer.preview.midnight.network/api/v1/graphql",
    nodeUri: "wss://rpc.preview.midnight.network",
    proofServerUri: "http://localhost:6300",
    faucetUrl: "https://faucet.preview.midnight.network",
  },
  preprod: {
    name: "Midnight Preprod Network",
    indexerUri: "https://indexer.preprod.midnight.network/api/v1/graphql",
    nodeUri: "wss://rpc.preprod.midnight.network",
    proofServerUri: "http://localhost:6300",
    faucetUrl: "https://faucet.preprod.midnight.network",
  },
};

async function checkProofServer(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = http.request(
        {
          hostname: u.hostname,
          port: u.port,
          path: "/",
          method: "GET",
          timeout: 2000,
        },
        (res) => {
          resolve(res.statusCode !== undefined);
        },
      );
      req.on("error", () => resolve(false));
      req.on("timeout", () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

async function main() {
  const targetNetwork = (process.argv[2] || "preprod").toLowerCase();
  const config = NETWORKS[targetNetwork] || NETWORKS.preprod;

  console.log(
    "================================================================",
  );
  console.log(
    "           VERITAS GATE — CONTRACT DEPLOYMENT PIPELINE          ",
  );
  console.log(
    "================================================================",
  );
  console.log(`Target Network   : ${config.name}`);
  console.log(`Node RPC         : ${config.nodeUri}`);
  console.log(`Indexer          : ${config.indexerUri}`);
  console.log(`Proof Server     : ${config.proofServerUri}`);
  console.log(`Faucet           : ${config.faucetUrl}`);
  console.log(
    "----------------------------------------------------------------",
  );

  // Step 1: Check Proof Server
  console.log("[1/4] Checking Proof Server connectivity...");
  const proofServerOnline = await checkProofServer(config.proofServerUri);
  if (proofServerOnline) {
    console.log("      ✓ Proof Server is running on port 6300.");
  } else {
    console.log("      ⚠ Proof server not responding at port 6300.");
    console.log(
      "        Run: docker run -d --name midnight-proof-server -p 6300:6300 midnightnetwork/proof-server:latest",
    );
  }

  // Step 2: Initialize Veritas Gate Compact Contract
  console.log("[2/4] Initializing Veritas Gate Compact contract package...");
  const defaultSecret = new Uint8Array(randomBytes(32));
  const contract = new Contract({
    get_employee_secret: (ctx) => [ctx.privateState, defaultSecret],
  });

  const dummyCoinPublicKeyHex = "00".repeat(32);
  const initContext = compactRuntime.createConstructorContext(
    { employeeSecret: defaultSecret },
    dummyCoinPublicKeyHex,
  );

  const initial = contract.initialState(initContext);
  console.log("      ✓ Initial contract state generated successfully.");

  // Step 3: Wallet credentials are supplied by the 1AM DApp Connector.
  console.log(
    "[3/4] Wallet credentials are supplied by the connected 1AM Wallet...",
  );
  console.log(
    "      Connect 1AM Wallet through the browser DApp Connector to balance and submit transactions.",
  );

  console.log(
    "[4/4] Deployment is available from the connected browser wallet.",
  );
  console.log("Deploy Status : USE THE BROWSER DEPLOY ACTION");
  console.log("");
  console.log(
    "Open the app, Connect 1AM Wallet to Preprod, and choose Deploy Contract to Preprod.",
  );
}

main().catch((err) => {
  console.error("Deployment error:", err);
  process.exit(1);
});

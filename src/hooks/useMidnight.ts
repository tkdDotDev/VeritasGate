import { useState, useEffect, useCallback } from "react";
import type {
  ConnectedAPI,
  InitialAPI,
} from "@midnight-ntwrk/dapp-connector-api";

export type WalletStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "not_installed"
  | "wrong_network"
  | "error";

export interface WalletState {
  status: WalletStatus;
  address: string | null;
  network: "preprod" | "preview" | "other" | null;
  walletApi: ConnectedAPI | null;
  error: string | null;
  serviceUris: {
    indexerUri?: string;
    nodeUri?: string;
    proofServerUri?: string;
  } | null;
}

declare global {
  interface Window {
    midnight?: Record<string, InitialAPI>;
  }
}

export function useMidnight() {
  const [wallet, setWallet] = useState<WalletState>({
    status: "disconnected",
    address: null,
    network: "preprod",
    walletApi: null,
    error: null,
    serviceUris: null,
  });

  const checkInstalled = useCallback((): boolean => {
    return (
      typeof window !== "undefined" &&
      Object.keys(window.midnight ?? {}).length > 0
    );
  }, []);

  const connect = useCallback(async () => {
    setWallet((prev) => ({ ...prev, status: "connecting", error: null }));

    try {
      if (typeof window === "undefined" || !window.midnight) {
        setWallet({
          status: "not_installed",
          address: null,
          network: null,
          walletApi: null,
          error:
            "1AM Wallet extension was not detected. Make sure the 1AM Wallet extension is installed and unlocked.",
          serviceUris: null,
        });
        return;
      }

      const wallets = Object.values(window.midnight) as InitialAPI[];

      // Veritas Gate uses 1AM Wallet exclusively.
      const walletApiProvider = wallets.find(
        (provider) => provider.rdns === "com.midnight.1am",
      );

      if (!walletApiProvider) {
        setWallet({
          status: "not_installed",
          address: null,
          network: null,
          walletApi: null,
          error: "1AM Wallet extension was not detected.",
          serviceUris: null,
        });
        return;
      }

      const api = await walletApiProvider.connect("preprod");
      const configuration = await api.getConfiguration();
      const balances = await api.getUnshieldedBalances();
      console.log("networkId:", configuration.networkId);
      console.log("Preprod balances:", balances);
      const shielded = await api.getShieldedBalances();
      console.log("Shielded balances:", shielded);
      const addresses = await api.getShieldedAddresses();
      console.log("Shielded address:", addresses.shieldedAddress);
      const addressInfo = await api.getUnshieldedAddress();
      const network = configuration.networkId.toLowerCase();
      const walletNetwork = network.includes("preview")
        ? "preview"
        : network.includes("preprod")
          ? "preprod"
          : "other";

      setWallet({
        status: walletNetwork === "other" ? "wrong_network" : "connected",
        address: addressInfo.unshieldedAddress,
        network: walletNetwork,
        walletApi: api,
        error: null,
        serviceUris: {
          indexerUri: configuration.indexerUri,
          nodeUri: configuration.substrateNodeUri,
          proofServerUri: configuration.proverServerUri,
        },
      });
    } catch (err: any) {
      const errorMessage =
        err?.message || "User rejected wallet connection request";
      setWallet({
        status: "error",
        address: null,
        network: null,
        walletApi: null,
        error: errorMessage,
        serviceUris: null,
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({
      status: "disconnected",
      address: null,
      network: "preprod",
      walletApi: null,
      error: null,
      serviceUris: null,
    });
  }, []);

  useEffect(() => {
    if (!checkInstalled()) {
      // Don't error immediately; start as disconnected so the user can connect.
      setWallet((prev) => ({ ...prev, status: "disconnected" }));
    }
  }, [checkInstalled]);

  return {
    ...wallet,
    isInstalled: checkInstalled(),
    walletApi: wallet.walletApi,
    connect,
    disconnect,
  };
}

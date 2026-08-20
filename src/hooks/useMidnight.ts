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
            "Midnight Lace Wallet extension was not detected. Install Lace from the Chrome Web Store and create a Midnight wallet inside it.",
          serviceUris: null,
        });
        return;
      }

      const wallets = Object.values(window.midnight) as InitialAPI[];
      const walletApiProvider =
        wallets.find((provider) =>
          provider.name.toLowerCase().includes("lace"),
        ) ?? wallets[0];

      if (!walletApiProvider) {
        setWallet({
          status: "not_installed",
          address: null,
          network: null,
          walletApi: null,
          error: "Midnight Lace Wallet extension was not detected.",
          serviceUris: null,
        });
        return;
      }

      const api = await walletApiProvider.connect("preprod");
      const configuration = await api.getConfiguration();
      const addressInfo = await api.getUnshieldedAddress();
      const network = configuration.networkId.toLowerCase();
      const walletNetwork = network.includes("preprod")
        ? "preprod"
        : network.includes("preview")
          ? "preview"
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

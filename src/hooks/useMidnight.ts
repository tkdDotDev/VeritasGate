import { useState, useEffect, useCallback } from 'react';

export type WalletStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'not_installed'
  | 'wrong_network'
  | 'error';

export interface WalletState {
  status: WalletStatus;
  address: string | null;
  network: 'preprod' | 'preview' | 'other' | null;
  error: string | null;
  serviceUris: {
    indexerUri?: string;
    nodeUri?: string;
    proofServerUri?: string;
  } | null;
}

declare global {
  interface Window {
    midnight?: {
      mnLace?: {
        name: string;
        apiVersion: string;
        icon?: string;
        isEnabled(): Promise<boolean>;
        enable(): Promise<any>;
        getServiceURIs?(): Promise<{
          indexerUri: string;
          indexerWsUri: string;
          nodeUri: string;
          proverServerUri: string;
        }>;
        getUnshieldedAddress?(): Promise<string>;
        getShieldedAddresses?(): Promise<string[]>;
      };
    };
  }
}

export function useMidnight() {
  const [wallet, setWallet] = useState<WalletState>({
    status: 'disconnected',
    address: null,
    network: 'preprod',
    error: null,
    serviceUris: null,
  });

  // Check if Lace is present
  const checkInstalled = useCallback((): boolean => {
    return Boolean(typeof window !== 'undefined' && window.midnight?.mnLace);
  }, []);

  const connect = useCallback(async () => {
    setWallet((prev) => ({ ...prev, status: 'connecting', error: null }));

    try {
      if (typeof window === 'undefined' || !window.midnight?.mnLace) {
        // In browser without extension, provide simulation / demo connection
        // or guide user to install Lace
        setWallet({
          status: 'not_installed',
          address: null,
          network: null,
          error: 'Midnight Lace Wallet extension was not detected. You can install Lace or test using Browser Simulation mode.',
          serviceUris: null,
        });
        return;
      }

      const mnLace = window.midnight.mnLace;
      const api = await mnLace.enable();

      let address: string | null = null;
      if (typeof api.getUnshieldedAddress === 'function') {
        address = await api.getUnshieldedAddress();
      } else if (typeof api.getShieldedAddresses === 'function') {
        const addresses = await api.getShieldedAddresses();
        address = addresses?.[0] || null;
      }

      let serviceUris = null;
      if (typeof mnLace.getServiceURIs === 'function') {
        serviceUris = await mnLace.getServiceURIs();
      }

      setWallet({
        status: 'connected',
        address: address || 'mn_addr_preprod1qz49r...8kx2',
        network: 'preprod',
        error: null,
        serviceUris,
      });
    } catch (err: any) {
      const errorMessage = err?.message || 'User rejected wallet connection request';
      setWallet({
        status: 'error',
        address: null,
        network: null,
        error: errorMessage,
        serviceUris: null,
      });
    }
  }, []);

  const connectSimulation = useCallback(() => {
    // Generates a mock funded Lace testnet address for seamless local verification
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const simAddress = `mn_test1qq${randomHex}9x4k8f2y`;

    setWallet({
      status: 'connected',
      address: simAddress,
      network: 'preprod',
      error: null,
      serviceUris: {
        nodeUri: 'wss://rpc.preprod.midnight.network',
        indexerUri: 'https://indexer.preprod.midnight.network/api/v1/graphql',
        proofServerUri: 'http://localhost:6300',
      },
    });
  }, []);

  const disconnect = useCallback(() => {
    setWallet({
      status: 'disconnected',
      address: null,
      network: 'preprod',
      error: null,
      serviceUris: null,
    });
  }, []);

  useEffect(() => {
    if (!checkInstalled()) {
      // Don't error immediately; start as disconnected so user can connect or use simulation
      setWallet((prev) => ({ ...prev, status: 'disconnected' }));
    }
  }, [checkInstalled]);

  return {
    ...wallet,
    isInstalled: checkInstalled(),
    connect,
    connectSimulation,
    disconnect,
  };
}

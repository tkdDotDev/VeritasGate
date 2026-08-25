import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { Contract } from '../../managed/contract/index.js';

const COMPILED_ASSETS_PATH = '/managed';

const baseContract = CompiledContract.make(
  'VeritasGate',
  Contract
);

export const veritasGateCompiledContract =
  CompiledContract.withCompiledFileAssets(
    baseContract,
    COMPILED_ASSETS_PATH
  );

# Veritas Gate — Technical Architecture & Privacy Specification

## 1. Overview
Veritas Gate is an enterprise-grade whistleblower portal constructed on the **Midnight blockchain**, delivering zero-knowledge privacy, verifiable corporate authorization, and immutability for corporate misconduct reporting.

## 2. Privacy Boundaries

### Public Ledger State (`export ledger`)
* **`submittedReports: Set<Bytes<32>>`**: Cryptographic fingerprints (SHA-256 / Blake2b) representing off-chain encrypted misconduct reports and evidence bundles.
* **`reportCount: Counter`**: Public aggregate counter of verified submissions.

### Private State & Witnesses (`witness`)
* **`get_employee_secret(): Bytes<32>`**: Whistleblower's private authorization credential.
* **Misconduct Details**: Plaintext report description, whistleblower names, employee ID, department, email, timestamps, and attached PDF/evidence files remain strictly off-chain and locally encrypted.

### Zero-Knowledge Proofs (`export circuit submitWhistleblowerReport`)
* Proves that the submitter possesses a valid corporate authorization secret without revealing who they are.
* Proves that the report fingerprint is unique and has not been submitted before.
* Discloses only the public 32-byte report fingerprint for ledger registration.

## 3. Off-Chain Storage & Lifecycle
1. **Local Report Creation & Encryption**: Employee prepares report and attaches PDF evidence. Everything is encrypted locally using symmetric encryption (e.g. AES-256-GCM) with an investigator/ombudsman public key.
2. **Off-Chain Archival**: Encrypted payload is pinned to IPFS / decentralized storage, yielding a Content Identifier (CID).
3. **Fingerprint Derivation**: SHA-256 hash of canonical report metadata + CID forms the 32-byte `reportHash`.
4. **ZK Proof Generation**: Off-chain Midnight Prover generates ZK proof combining private corporate witness and `reportHash`.
5. **Ledger Registration**: Contract registers `reportHash` into `submittedReports` and increments `reportCount`.

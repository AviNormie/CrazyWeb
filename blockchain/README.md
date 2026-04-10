# Proof of Presence Plant — contract

```bash
cp .env.example .env
# fund DEPLOYER; set COORDINATOR_ADDRESS to the wallet for COORDINATOR_PRIVATE_KEY in root .env.local
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network sepolia
```

Paste printed `NEXT_PUBLIC_POP_CONTRACT_ADDRESS` into the repo root `.env.local`.

- **SECONDS_PER_DAY** defaults to 30 in deploy if unset.
- Solidity **0.8.24** with **Cancun** EVM (OpenZeppelin 5.x).

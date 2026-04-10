# How to run CrazyWeb + Proof of Presence Plant

## 1. Install (repo root)

```bash
npm install
```

## 2. Environment (repo root)

Copy [.env.example](./.env.example) → **`.env.local`** and fill in:

| Variable | Purpose |
|----------|---------|
| `ALCHEMY_SEPOLIA_URL` / `NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL` | Same Sepolia HTTPS URL (both lines). |
| `POP_CONTRACT_ADDRESS` / `NEXT_PUBLIC_POP_CONTRACT_ADDRESS` | **Same** deployed contract `0x…` (server accepts either; client needs `NEXT_PUBLIC_*` for on-chain reads). |
| `COORDINATOR_PRIVATE_KEY` / `COORDINATOR_ADDRESS` | Same signer the contract was deployed with as `coordinator`. |
| `DAILY_CODE_SECRET` | Any long random string (daily meet codes). |
| `POP_SHOW_CODE` | `true` for demo hints; optional. |

Restart `npm run dev` after changing `.env.local`.

## 3. Smart contract (first time or after edits)

```bash
cd blockchain
npm install
npx hardhat compile
```

Deploy to Sepolia (need `blockchain/.env`: `DEPLOYER_PRIVATE_KEY`, `ALCHEMY_SEPOLIA_URL`, `COORDINATOR_ADDRESS`):

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

Copy the printed address into **both** `POP_CONTRACT_ADDRESS` and `NEXT_PUBLIC_POP_CONTRACT_ADDRESS` in root `.env.local`.

## 4. Regenerate ABI in the Next app (only if you changed Solidity)

After `npx hardhat compile`:

```bash
node -e "const j=require('./blockchain/artifacts/contracts/ProofOfPresencePlant.sol/ProofOfPresencePlant.json'); require('fs').writeFileSync('./lib/pop/abi.ts', 'export const popContractAbi = ' + JSON.stringify(j.abi, null, '\t') + ' as const;\\n')"
```

(Run from **repo root**.)

## 5. Run the web app

```bash
npm run dev
```

- Main site: [http://localhost:3000](http://localhost:3000)
- Pop Plant: [http://localhost:3000/pop](http://localhost:3000/pop)

## 6. Wallet testing

1. Install **MetaMask** and add the **Sepolia** network.
2. Get Sepolia ETH from a faucet (search “Sepolia faucet”).
3. Open `/pop`, click **Connect wallet (MetaMask)** — your extension should prompt you.
4. If session API still errors, read the red message: usually missing contract address, bad RPC URL, or contract not deployed on Sepolia.

## 7. Yarn

This repo uses `npm` by default; `yarn dev` works if dependencies are installed with Yarn.

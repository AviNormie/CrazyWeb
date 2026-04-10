# Proof of Presence Plant — hackathon quickstart

## What it does

1. **Daily meet code** per city (deterministic from `DAILY_CODE_SECRET` + city + day index). Chain **“day”** length defaults to **30 seconds** (`SECONDS_PER_DAY` at deploy).
2. **POST `/api/pop/verify`** — wallet + city + code; needs **≥2 verified** addresses per city before **watering** is allowed (API + UI).
3. **POST `/api/pop/sign-water`** — coordinator (server) signs EIP-712; user submits **`waterPlant(cityHash, day, codeHash, sig)`** on **Sepolia**.
4. **Day 7** water → **ERC-721** mint to the caller.

## Setup

1. Copy [`.env.example`](./.env.example) → `.env.local` in the repo root.
2. Generate a throwaway wallet for the coordinator. Set `COORDINATOR_ADDRESS` and `COORDINATOR_PRIVATE_KEY` (same account).
3. In [`blockchain/`](./blockchain/): copy `blockchain/.env.example` → `blockchain/.env` with `DEPLOYER_PRIVATE_KEY` (funded on Sepolia), `ALCHEMY_SEPOLIA_URL`, `COORDINATOR_ADDRESS`, then:

   ```bash
   cd blockchain && npm install && npx hardhat compile
   npx hardhat run scripts/deploy.ts --network sepolia
   ```

4. Paste printed address into `POP_CONTRACT_ADDRESS` and `NEXT_PUBLIC_POP_CONTRACT_ADDRESS`.

5. Root app:

   ```bash
   npm install && npm run dev
   ```

6. Open [http://localhost:3000/pop](http://localhost:3000/pop). Use two browsers / two MetaMask accounts with the **same city** and the **same meet code**.
7. Rehearsal: set `POP_SHOW_CODE=true` and use **Demo hint** (or `GET /api/pop/hint?city=...`). Turn off for judging.

## Notes

- Verified users are **in memory**; restarting Next.js clears them (re-verify).
- Deployed **coordinator** on the contract **must** be the address for `COORDINATOR_PRIVATE_KEY` used by the API.

import * as dotenv from "dotenv";
import path from "node:path";
import { ethers } from "hardhat";

const blockchainDir = path.resolve(__dirname, "..");
const repoRoot = path.resolve(blockchainDir, "..");

// Load all locations; repo root `.env.local` last so it wins over stale `blockchain/.env*`.
dotenv.config({ path: path.join(blockchainDir, ".env") });
dotenv.config({ path: path.join(blockchainDir, ".env.local"), override: true });
dotenv.config({ path: path.join(repoRoot, ".env.local"), override: true });

function stripQuotes(s: string): string {
	return s.trim().replace(/^["']|["']$/g, "");
}

function parseCoordinatorPrivateKey(): string | null {
	const pkRaw = process.env.COORDINATOR_PRIVATE_KEY ?? "";
	const pk = stripQuotes(pkRaw).replace(/^0x/i, "");
	return /^[\dA-Fa-f]{64}$/.test(pk) ? pk : null;
}

/**
 * Real `0x` + 40 hex only. Placeholders (`.env.example`) are ignored when a valid
 * `COORDINATOR_PRIVATE_KEY` is set — ethers v6 may otherwise treat bad strings as ENS.
 */
function resolveCoordinatorAddress(): string {
	const explicitRaw = process.env.COORDINATOR_ADDRESS;
	const explicit = explicitRaw ? stripQuotes(explicitRaw) : "";
	const pkHex = parseCoordinatorPrivateKey();

	if (explicit && ethers.isAddress(explicit)) {
		return ethers.getAddress(explicit);
	}

	if (explicit && !ethers.isAddress(explicit)) {
		if (pkHex) {
			console.warn(
				"COORDINATOR_ADDRESS is missing or still a placeholder; using address from COORDINATOR_PRIVATE_KEY.",
			);
			return new ethers.Wallet(`0x${pkHex}`).address;
		}
		throw new Error(
			`COORDINATOR_ADDRESS is not a valid Ethereum address (got "${explicit.slice(0, 24)}…"). ` +
				"Replace it with your coordinator wallet `0x…` or remove the line and set COORDINATOR_PRIVATE_KEY (64 hex chars).",
		);
	}

	if (pkHex) {
		return new ethers.Wallet(`0x${pkHex}`).address;
	}

	throw new Error(
		"Set COORDINATOR_PRIVATE_KEY (64 hex chars) or a valid COORDINATOR_ADDRESS in repo root `.env.local` " +
			"or `blockchain/.env.local` (Hardhat did not load a valid key). Remove placeholder lines like 0xYour…",
	);
}

async function main() {
	const signers = await ethers.getSigners();
	if (signers.length === 0) {
		throw new Error(
			"No deployer key loaded. A private key is 64 hex characters (MetaMask → ⋮ → Account details → Show private key). " +
				"Your 0x… address is only 40 hex — do NOT paste it into *_PRIVATE_KEY. " +
				"Set DEPLOYER_PRIVATE_KEY or COORDINATOR_PRIVATE_KEY in repo root or `blockchain/.env.local` (check terminal for [hardhat] warnings).",
		);
	}

	const coordinatorAddress = resolveCoordinatorAddress();

	const secondsPerDay = BigInt(process.env.SECONDS_PER_DAY ?? "30");
	const baseUri = process.env.POP_NFT_BASE_URI ?? "https://pop-plant.hackathon/metadata/";

	const Factory = await ethers.getContractFactory("ProofOfPresencePlant");
	const contract = await Factory.deploy(
		coordinatorAddress,
		secondsPerDay,
		baseUri,
	);
	await contract.waitForDeployment();
	const address = await contract.getAddress();

	console.log("ProofOfPresencePlant deployed to:", address);
	console.log("");
	console.log("Add to .env.local:");
	console.log(`NEXT_PUBLIC_POP_CONTRACT_ADDRESS=${address}`);
	console.log(`POP_CONTRACT_ADDRESS=${address}`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});

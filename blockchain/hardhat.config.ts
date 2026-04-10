import * as dotenv from "dotenv";
import path from "node:path";
import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

// `blockchain/.env`, then `blockchain/.env.local`, then repo root `.env.local` (wins on duplicates).
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, ".env.local"), override: true });
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local"), override: true });

function stripQuotes(s: string): string {
	return s.trim().replace(/^["']|["']$/g, "");
}

/** Reject placeholders; Hardhat HH8 if `accounts` gets a short/non-hex string. */
function normalizedPrivateKey(
	raw: string | undefined,
	envKey: string,
): `0x${string}` | null {
	if (!raw) return null;
	const pk = stripQuotes(raw).replace(/^0x/i, "");
	if (pk.length === 40 && /^[\dA-Fa-f]{40}$/.test(pk)) {
		console.warn(
			`[hardhat] ${envKey} looks like a wallet address (40 hex), not a secret key (64 hex). ` +
				"In MetaMask: ⋮ → Account details → Show private key, then paste that value.",
		);
		return null;
	}
	if (!/^[\dA-Fa-f]{64}$/.test(pk)) {
		if (pk.length > 0) {
			console.warn(
				`[hardhat] ${envKey} must be exactly 64 hex characters after removing 0x (got ${pk.length}).`,
			);
		}
		return null;
	}
	return `0x${pk}` as `0x${string}`;
}

function resolveDeployerKey(): `0x${string}` | null {
	return (
		normalizedPrivateKey(process.env.DEPLOYER_PRIVATE_KEY, "DEPLOYER_PRIVATE_KEY") ??
		normalizedPrivateKey(process.env.COORDINATOR_PRIVATE_KEY, "COORDINATOR_PRIVATE_KEY")
	);
}

const deployerKey = resolveDeployerKey();

const config: HardhatUserConfig = {
	solidity: {
		version: "0.8.24",
		settings: {
			optimizer: { enabled: true, runs: 200 },
			evmVersion: "cancun",
		},
	},
	networks: {
		sepolia: {
			url: process.env.ALCHEMY_SEPOLIA_URL ?? "",
			accounts: deployerKey ? [deployerKey] : [],
		},
	},
};

export default config;

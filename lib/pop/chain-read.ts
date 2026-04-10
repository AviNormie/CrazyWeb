import {
	createPublicClient,
	http,
	type Address,
	type Chain,
	type PublicClient,
} from "viem";
import { sepolia } from "viem/chains";

import { popContractAbi } from "./abi";

/**
 * viem returns empty `0x` for reads when the address has no contract bytecode
 * (common mistake: pasting your wallet instead of the deployed contract).
 */
export async function ensurePopContractDeployed(
	client: PublicClient,
	contractAddress: Address,
): Promise<void> {
	const code = await client.getBytecode({ address: contractAddress });
	if (!code || code === "0x") {
		throw new Error(
			"No contract bytecode at POP_CONTRACT_ADDRESS on Sepolia. Use the deployed ProofOfPresencePlant address from your deploy script output — not your MetaMask wallet address.",
		);
	}
}

export function getPopPublicClient(rpcUrl: string): PublicClient {
	return createPublicClient({
		chain: sepolia as Chain,
		transport: http(rpcUrl),
	});
}

export async function readPopCurrentDay(
	client: PublicClient,
	contractAddress: Address,
	cityHash: `0x${string}`,
): Promise<number> {
	const day = await client.readContract({
		address: contractAddress,
		abi: popContractAbi,
		functionName: "getCurrentDay",
		args: [cityHash],
	});
	return Number(day);
}

export async function readPopNonce(
	client: PublicClient,
	contractAddress: Address,
	user: Address,
): Promise<bigint> {
	return client.readContract({
		address: contractAddress,
		abi: popContractAbi,
		functionName: "nonces",
		args: [user],
	});
}

export async function readPlantSummary(
	client: PublicClient,
	contractAddress: Address,
	cityHash: `0x${string}`,
): Promise<{ sessionStart: bigint; lastWateredDay: number; completed: boolean }> {
	const row = await client.readContract({
		address: contractAddress,
		abi: popContractAbi,
		functionName: "plants",
		args: [cityHash],
	});
	const [sessionStart, lastWateredDay, completed] = row as [
		bigint,
		number,
		boolean,
	];
	return {
		sessionStart,
		lastWateredDay: Number(lastWateredDay),
		completed,
	};
}

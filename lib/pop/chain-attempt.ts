import type { Address } from "viem";

import {
	ensurePopContractDeployed,
	getPopPublicClient,
	readPlantSummary,
	readPopCurrentDay,
} from "./chain-read";
import { getAlchemySepoliaUrl, getPopContractAddress } from "./env-server";

export type ChainPlantRead = {
	currentDay: number;
	completed: boolean;
	lastWateredDay: number;
};

/** Try Sepolia reads; returns `null` if misconfigured or RPC/contract fails (use off-chain fallback). */
export async function tryReadChainPlant(
	cityHash: `0x${string}`,
): Promise<ChainPlantRead | null> {
	const contract = getPopContractAddress();
	const rpc = getAlchemySepoliaUrl();
	if (!contract || !rpc) return null;

	try {
		const client = getPopPublicClient(rpc);
		await ensurePopContractDeployed(client, contract as Address);
		const currentDay = await readPopCurrentDay(client, contract, cityHash);
		const plant = await readPlantSummary(client, contract, cityHash);
		return {
			currentDay,
			completed: plant.completed,
			lastWateredDay: plant.lastWateredDay,
		};
	} catch {
		return null;
	}
}

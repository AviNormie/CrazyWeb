import { hashCity } from "./city";
import { POP_CITIES } from "./cities";
import { tryReadChainPlant } from "./chain-attempt";
import { hasCoordinatorSigningKey } from "./coordinator-key";
import type { LeaderboardCityRow } from "./leaderboard-types";
import {
	offchainCurrentDay,
	offchainPlantSnapshot,
} from "./offchain-plant";
import { verifiedCount } from "./verified-store";

export type { LeaderboardCityRow } from "./leaderboard-types";

export async function buildLeaderboardRows(): Promise<LeaderboardCityRow[]> {
	const rows = await Promise.all(
		POP_CITIES.map(async ({ id: cityId, label }) => {
			const cityHash = hashCity(cityId);
			const [count, chain] = await Promise.all([
				verifiedCount(cityId),
				tryReadChainPlant(cityHash),
			]);

			let currentDay: number;
			let completed: boolean;
			let lastWateredDay: number;
			let plantSource: "chain" | "offchain";

			if (chain && hasCoordinatorSigningKey()) {
				currentDay = chain.currentDay;
				completed = chain.completed;
				lastWateredDay = chain.lastWateredDay;
				plantSource = "chain";
			} else {
				const p = await offchainPlantSnapshot(cityId);
				currentDay = await offchainCurrentDay(cityId);
				completed = p.completed;
				lastWateredDay = p.lastWateredDay;
				plantSource = "offchain";
			}

			const score =
				(completed ? 1_000_000 : 0) +
				lastWateredDay * 1_000 +
				count * 10 +
				currentDay;

			return {
				cityId,
				label,
				verifiedCount: count,
				lastWateredDay,
				currentDay,
				completed,
				plantSource,
				score,
			};
		}),
	);

	rows.sort((a, b) => b.score - a.score);
	return rows;
}

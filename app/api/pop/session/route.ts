import { hashCity } from "@/lib/pop/city";
import { labelForCityId, parsePopCityId } from "@/lib/pop/cities";
import { tryReadChainPlant } from "@/lib/pop/chain-attempt";
import { hasCoordinatorSigningKey } from "@/lib/pop/coordinator-key";
import {
	offchainCurrentDay,
	offchainPlantSnapshot,
} from "@/lib/pop/offchain-plant";
import { wateringDayForTx } from "@/lib/pop/plant-day";
import { listVerifiedAddresses, verifiedCount } from "@/lib/pop/verified-store";

export const runtime = "nodejs";

const MIN_VERIFIED = 2;

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const cityRaw = searchParams.get("city");
	const cityId = parsePopCityId(cityRaw);
	if (!cityId) {
		return Response.json(
			{ error: "invalid or missing city (use a supported city id)" },
			{ status: 400 },
		);
	}

	const cityHash = hashCity(cityId);
	const chain = await tryReadChainPlant(cityHash);

	let mode: "chain" | "offchain";
	let currentDay: number;
	let completed: boolean;
	let lastWateredDay: number;

	if (chain && hasCoordinatorSigningKey()) {
		mode = "chain";
		currentDay = chain.currentDay;
		completed = chain.completed;
		lastWateredDay = chain.lastWateredDay;
	} else {
		mode = "offchain";
		const p = await offchainPlantSnapshot(cityId);
		currentDay = await offchainCurrentDay(cityId);
		completed = p.completed;
		lastWateredDay = p.lastWateredDay;
	}

	const wateringDay = wateringDayForTx(currentDay, lastWateredDay);
	const count = await verifiedCount(cityId);
	const canWater =
		count >= MIN_VERIFIED &&
		!completed &&
		wateringDay >= 1 &&
		wateringDay <= 7;

	return Response.json({
		cityId,
		cityLabel: labelForCityId(cityId),
		cityHash,
		mode,
		verifiedCount: count,
		verifiedAddresses: await listVerifiedAddresses(cityId),
		minVerified: MIN_VERIFIED,
		currentDay,
		completed,
		lastWateredDay,
		wateringDay,
		canWater,
	});
}

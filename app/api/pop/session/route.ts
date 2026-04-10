import { hashCity, normalizeCity } from "@/lib/pop/city";
import {
	getPopPublicClient,
	readPlantSummary,
	readPopCurrentDay,
} from "@/lib/pop/chain-read";
import { getAlchemySepoliaUrl, getPopContractAddress } from "@/lib/pop/env-server";
import { verifiedCount } from "@/lib/pop/verified-store";

export const runtime = "nodejs";

const MIN_VERIFIED = 2;

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const cityRaw = searchParams.get("city");
	if (!cityRaw?.trim()) {
		return Response.json({ error: "city required" }, { status: 400 });
	}

	const contract = getPopContractAddress();
	const rpc = getAlchemySepoliaUrl();
	if (!contract) {
		return Response.json(
			{
				error:
					"Set POP_CONTRACT_ADDRESS or NEXT_PUBLIC_POP_CONTRACT_ADDRESS (deployed contract on Sepolia).",
			},
			{ status: 500 },
		);
	}
	if (!rpc) {
		return Response.json(
			{
				error:
					"Set ALCHEMY_SEPOLIA_URL or NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL.",
			},
			{ status: 500 },
		);
	}

	const cityNorm = normalizeCity(cityRaw);
	const cityHash = hashCity(cityRaw);
	const client = getPopPublicClient(rpc);

	let currentDay: number;
	let completed = false;
	let lastWateredDay = 0;
	try {
		currentDay = await readPopCurrentDay(client, contract, cityHash);
		const plant = await readPlantSummary(client, contract, cityHash);
		completed = plant.completed;
		lastWateredDay = plant.lastWateredDay;
	} catch (e) {
		const msg = e instanceof Error ? e.message : "chain read failed";
		return Response.json({ error: "chain read failed", detail: msg }, { status: 502 });
	}

	const count = verifiedCount(cityNorm);
	const canWater =
		count >= MIN_VERIFIED &&
		!completed &&
		currentDay >= 1 &&
		currentDay <= 7;

	return Response.json({
		city: cityNorm,
		cityHash,
		verifiedCount: count,
		minVerified: MIN_VERIFIED,
		currentDay,
		completed,
		lastWateredDay,
		canWater,
	});
}

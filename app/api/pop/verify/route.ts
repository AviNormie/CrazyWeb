import { type Address, isAddress } from "viem";

import { hashCity } from "@/lib/pop/city";
import { tryReadChainPlant } from "@/lib/pop/chain-attempt";
import { hasCoordinatorSigningKey } from "@/lib/pop/coordinator-key";
import { parsePopCityId } from "@/lib/pop/cities";
import {
	codeDayFromChainCurrentDay,
	deriveDailyCode,
} from "@/lib/pop/daily-code";
import {
	offchainCurrentDay,
} from "@/lib/pop/offchain-plant";
import { addVerified, verifiedCount } from "@/lib/pop/verified-store";

export const runtime = "nodejs";

export async function POST(req: Request) {
	let body: { city?: string; code?: string; address?: string };
	try {
		body = await req.json();
	} catch {
		return Response.json({ error: "invalid json" }, { status: 400 });
	}

	const { city: cityRaw, code: codeRaw, address: addrRaw } = body;
	if (!cityRaw?.trim() || !codeRaw?.trim() || !addrRaw?.trim()) {
		return Response.json(
			{ error: "city, code, and address required" },
			{ status: 400 },
		);
	}
	const cityId = parsePopCityId(cityRaw);
	if (!cityId) {
		return Response.json({ error: "invalid city" }, { status: 400 });
	}
	if (!isAddress(addrRaw)) {
		return Response.json({ error: "invalid address" }, { status: 400 });
	}
	const address = addrRaw as Address;

	const secret = process.env.DAILY_CODE_SECRET;
	if (!secret) {
		return Response.json(
			{ error: "DAILY_CODE_SECRET not configured" },
			{ status: 500 },
		);
	}

	const cityHash = hashCity(cityId);
	const chain = await tryReadChainPlant(cityHash);
	const useChainLogic = Boolean(chain && hasCoordinatorSigningKey());
	const logicDay = useChainLogic && chain ? chain.currentDay : offchainCurrentDay(cityId);

	const dayForCode = codeDayFromChainCurrentDay(logicDay);
	const expected = deriveDailyCode(secret, cityId, dayForCode);
	const got = codeRaw.trim().toUpperCase();

	if (got !== expected) {
		return Response.json(
			{
				ok: false,
				error: "invalid code",
				verifiedCount: verifiedCount(cityId),
				currentDay: logicDay,
			},
			{ status: 401 },
		);
	}

	const count = addVerified(cityId, address);

	return Response.json({
		ok: true,
		verifiedCount: count,
		currentDay: logicDay,
		codeDayUsed: dayForCode,
		mode: useChainLogic ? "chain" : "offchain",
	});
}

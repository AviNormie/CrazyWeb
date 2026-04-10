import { hashCity } from "@/lib/pop/city";
import { tryReadChainPlant } from "@/lib/pop/chain-attempt";
import { hasCoordinatorSigningKey } from "@/lib/pop/coordinator-key";
import { parsePopCityId } from "@/lib/pop/cities";
import {
	codeDayFromChainCurrentDay,
	deriveDailyCode,
} from "@/lib/pop/daily-code";
import { offchainCurrentDay } from "@/lib/pop/offchain-plant";

export const runtime = "nodejs";

export async function GET(req: Request) {
	const show =
		process.env.POP_SHOW_CODE === "true" ||
		process.env.POP_DEMO_HINT === "true" ||
		process.env.NODE_ENV === "development";
	if (!show) {
		return Response.json({ error: "not available" }, { status: 404 });
	}

	const { searchParams } = new URL(req.url);
	const cityRaw = searchParams.get("city");
	const cityId = parsePopCityId(cityRaw);
	if (!cityId) {
		return Response.json({ error: "invalid or missing city" }, { status: 400 });
	}

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
	const logicDay =
		useChainLogic && chain
			? chain.currentDay
			: await offchainCurrentDay(cityId);

	const dayForCode = codeDayFromChainCurrentDay(logicDay);
	const code = deriveDailyCode(secret, cityId, dayForCode);

	const payload: Record<string, unknown> = {
		cityId,
		currentDay: logicDay,
		codeDayUsed: dayForCode,
		code,
		mode: useChainLogic ? "chain" : "offchain",
	};

	if (process.env.POP_SHOW_INTERNAL_LABELS === "true") {
		payload.note = "Disable POP_SHOW_CODE / POP_DEMO_HINT for public demos";
	}

	return Response.json(payload);
}

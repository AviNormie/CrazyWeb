import { hashCity, normalizeCity } from "@/lib/pop/city";
import {
	getPopPublicClient,
	readPopCurrentDay,
} from "@/lib/pop/chain-read";
import {
	codeDayFromChainCurrentDay,
	deriveDailyCode,
} from "@/lib/pop/daily-code";
import { getAlchemySepoliaUrl, getPopContractAddress } from "@/lib/pop/env-server";

export const runtime = "nodejs";

export async function GET(req: Request) {
	const show =
		process.env.POP_SHOW_CODE === "true" || process.env.NODE_ENV === "development";
	if (!show) {
		return Response.json({ error: "not available" }, { status: 404 });
	}

	const { searchParams } = new URL(req.url);
	const cityRaw = searchParams.get("city");
	if (!cityRaw?.trim()) {
		return Response.json({ error: "city required" }, { status: 400 });
	}

	const secret = process.env.DAILY_CODE_SECRET;
	const contract = getPopContractAddress();
	const rpc = getAlchemySepoliaUrl();
	if (!secret) {
		return Response.json(
			{ error: "DAILY_CODE_SECRET not configured" },
			{ status: 500 },
		);
	}
	if (!contract) {
		return Response.json(
			{
				error:
					"Set POP_CONTRACT_ADDRESS or NEXT_PUBLIC_POP_CONTRACT_ADDRESS",
			},
			{ status: 500 },
		);
	}
	if (!rpc) {
		return Response.json(
			{
				error:
					"Set ALCHEMY_SEPOLIA_URL or NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL",
			},
			{ status: 500 },
		);
	}

	const cityNorm = normalizeCity(cityRaw);
	const cityHash = hashCity(cityRaw);
	const client = getPopPublicClient(rpc);

	let chainDay: number;
	try {
		chainDay = await readPopCurrentDay(client, contract, cityHash);
	} catch {
		return Response.json({ error: "chain read failed" }, { status: 502 });
	}

	const dayForCode = codeDayFromChainCurrentDay(chainDay);
	const code = deriveDailyCode(secret, cityNorm, dayForCode);

	return Response.json({
		city: cityNorm,
		currentDay: chainDay,
		codeDayUsed: dayForCode,
		code,
		hackathonNote: "Disable POP_SHOW_CODE for serious demos",
	});
}

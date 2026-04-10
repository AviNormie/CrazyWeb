import { type Address, isAddress } from "viem";

import { hashCity, normalizeCity } from "@/lib/pop/city";
import {
	codeDayFromChainCurrentDay,
	deriveDailyCode,
} from "@/lib/pop/daily-code";
import {
	getPopPublicClient,
	readPopCurrentDay,
} from "@/lib/pop/chain-read";
import { getAlchemySepoliaUrl, getPopContractAddress } from "@/lib/pop/env-server";
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
	if (!isAddress(addrRaw)) {
		return Response.json({ error: "invalid address" }, { status: 400 });
	}
	const address = addrRaw as Address;

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
	const expected = deriveDailyCode(secret, cityNorm, dayForCode);
	const got = codeRaw.trim().toUpperCase();

	if (got !== expected) {
		return Response.json(
			{
				ok: false,
				error: "invalid code",
				verifiedCount: verifiedCount(cityNorm),
				currentDay: chainDay,
			},
			{ status: 401 },
		);
	}

	const count = addVerified(cityNorm, address);

	return Response.json({
		ok: true,
		verifiedCount: count,
		currentDay: chainDay,
		codeDayUsed: dayForCode,
	});
}

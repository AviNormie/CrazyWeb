import { type Address, isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

import { hashCity, hashMeetCode } from "@/lib/pop/city";
import { parsePopCityId } from "@/lib/pop/cities";
import {
	ensurePopContractDeployed,
	getPopPublicClient,
	readPlantSummary,
	readPopCurrentDay,
	readPopNonce,
} from "@/lib/pop/chain-read";
import {
	codeDayFromChainCurrentDay,
	deriveDailyCode,
} from "@/lib/pop/daily-code";
import { coordinatorPkHex } from "@/lib/pop/coordinator-key";
import { getAlchemySepoliaUrl, getPopContractAddress } from "@/lib/pop/env-server";
import { popEip712Domain, POP_EIP712_TYPES } from "@/lib/pop/eip712";
import {
	offchainCurrentDay,
	offchainPlantSnapshot,
	offchainWaterPlant,
} from "@/lib/pop/offchain-plant";
import { wateringDayForTx } from "@/lib/pop/plant-day";
import { isVerified, verifiedCount } from "@/lib/pop/verified-store";

export const runtime = "nodejs";

const MIN_VERIFIED = 2;

export async function POST(req: Request) {
	let body: {
		city?: string;
		address?: string;
		code?: string;
		day?: number;
	};
	try {
		body = await req.json();
	} catch {
		return Response.json({ error: "invalid json" }, { status: 400 });
	}

	const { city: cityRaw, address: addrRaw, code: codeRaw, day } = body;
	if (
		!cityRaw?.trim() ||
		!addrRaw?.trim() ||
		!codeRaw?.trim() ||
		day === undefined
	) {
		return Response.json(
			{ error: "city, address, code, and day required" },
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

	if ((await verifiedCount(cityId)) < MIN_VERIFIED) {
		return Response.json(
			{ error: "need at least two verified users" },
			{ status: 403 },
		);
	}
	if (!(await isVerified(cityId, address))) {
		return Response.json({ error: "wallet not verified for this city" }, { status: 403 });
	}

	const secret = process.env.DAILY_CODE_SECRET;
	if (!secret) {
		return Response.json(
			{ error: "DAILY_CODE_SECRET not configured" },
			{ status: 500 },
		);
	}

	const cityHash = hashCity(cityId);
	const codeHash = hashMeetCode(codeRaw);

	const contract = getPopContractAddress();
	const rpc = getAlchemySepoliaUrl();
	const pk = coordinatorPkHex();

	if (contract && rpc && pk) {
		try {
			const client = getPopPublicClient(rpc);
			await ensurePopContractDeployed(client, contract);
			const chainDay = await readPopCurrentDay(client, contract, cityHash);
			const plant = await readPlantSummary(client, contract, cityHash);
			const effective = wateringDayForTx(chainDay, plant.lastWateredDay);

			const dayForCode = codeDayFromChainCurrentDay(chainDay);
			const expectedCode = deriveDailyCode(secret, cityId, dayForCode);
			if (codeRaw.trim().toUpperCase() !== expectedCode) {
				return Response.json({ error: "invalid meet code" }, { status: 401 });
			}

			if (day !== effective) {
				return Response.json(
					{ error: "day does not match on-chain current day", chainDay: effective },
					{ status: 409 },
				);
			}
			if (effective < 1 || effective > 7) {
				return Response.json({ error: "plant cannot be watered this day" }, { status: 409 });
			}

			const nonce = await readPopNonce(client, contract, address);
			const account = privateKeyToAccount(`0x${pk}` as `0x${string}`);

			const signature = await account.signTypedData({
				domain: popEip712Domain(sepolia.id, contract),
				types: POP_EIP712_TYPES,
				primaryType: "Water",
				message: {
					user: address,
					cityHash,
					day: effective,
					codeHash,
					nonce,
				},
			});

			return Response.json({
				mode: "chain" as const,
				signature,
				codeHash,
				nonce: nonce.toString(),
				chainDay: effective,
			});
		} catch {
			// fall through to shared plant
		}
	}

	const logicDay = await offchainCurrentDay(cityId);
	const snap = await offchainPlantSnapshot(cityId);
	const effectiveOff = wateringDayForTx(logicDay, snap.lastWateredDay);

	const dayForCodeOff = codeDayFromChainCurrentDay(logicDay);
	const expectedOff = deriveDailyCode(secret, cityId, dayForCodeOff);
	if (codeRaw.trim().toUpperCase() !== expectedOff) {
		return Response.json({ error: "invalid meet code" }, { status: 401 });
	}

	if (day !== effectiveOff) {
		return Response.json(
			{ error: "day does not match current plant day", chainDay: effectiveOff },
			{ status: 409 },
		);
	}

	const w = await offchainWaterPlant(cityId, address, effectiveOff);
	if (!w.ok) {
		return Response.json({ error: w.error }, { status: 409 });
	}

	return Response.json({
		mode: "offchain" as const,
		chainDay: w.currentDay,
		lastWateredDay: w.lastWateredDay,
		completed: w.completed,
		simulatedMint: w.completed && w.lastWateredDay === 7,
	});
}

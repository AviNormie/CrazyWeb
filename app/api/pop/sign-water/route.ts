import {
	type Address,
	isAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

import { hashCity, hashMeetCode, normalizeCity } from "@/lib/pop/city";
import {
	getPopPublicClient,
	readPopCurrentDay,
	readPopNonce,
} from "@/lib/pop/chain-read";
import { getAlchemySepoliaUrl, getPopContractAddress } from "@/lib/pop/env-server";
import { popEip712Domain, POP_EIP712_TYPES } from "@/lib/pop/eip712";
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
	if (!isAddress(addrRaw)) {
		return Response.json({ error: "invalid address" }, { status: 400 });
	}
	const address = addrRaw as Address;

	const pk = process.env.COORDINATOR_PRIVATE_KEY?.replace(/^0x/, "");
	const contract = getPopContractAddress();
	const rpc = getAlchemySepoliaUrl();
	if (!pk) {
		return Response.json(
			{ error: "COORDINATOR_PRIVATE_KEY not configured" },
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
	if (verifiedCount(cityNorm) < MIN_VERIFIED) {
		return Response.json(
			{ error: "need at least two verified users" },
			{ status: 403 },
		);
	}
	if (!isVerified(cityNorm, address)) {
		return Response.json({ error: "wallet not verified for this city" }, { status: 403 });
	}

	const cityHash = hashCity(cityRaw);
	const codeHash = hashMeetCode(codeRaw);
	const client = getPopPublicClient(rpc);

	let chainDay: number;
	let nonce: bigint;
	try {
		chainDay = await readPopCurrentDay(client, contract, cityHash);
		nonce = await readPopNonce(client, contract, address);
	} catch {
		return Response.json({ error: "chain read failed" }, { status: 502 });
	}

	if (day !== chainDay) {
		return Response.json(
			{ error: "day does not match on-chain current day", chainDay },
			{ status: 409 },
		);
	}
	if (chainDay < 1 || chainDay > 7) {
		return Response.json({ error: "plant cannot be watered this day" }, { status: 409 });
	}

	const account = privateKeyToAccount(`0x${pk}` as `0x${string}`);

	const signature = await account.signTypedData({
		domain: popEip712Domain(sepolia.id, contract),
		types: POP_EIP712_TYPES,
		primaryType: "Water",
		message: {
			user: address,
			cityHash,
			day: chainDay,
			codeHash,
			nonce,
		},
	});

	return Response.json({
		signature,
		codeHash,
		nonce: nonce.toString(),
		chainDay,
	});
}

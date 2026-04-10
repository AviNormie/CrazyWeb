import type { Address } from "viem";
import { isAddress } from "viem";

/** Server routes: allow either POP_* or NEXT_PUBLIC_* so one copy-paste works. */
export function getPopContractAddress(): Address | undefined {
	const raw =
		process.env.POP_CONTRACT_ADDRESS ??
		process.env.NEXT_PUBLIC_POP_CONTRACT_ADDRESS;
	if (!raw || !isAddress(raw)) return undefined;
	return raw as Address;
}

export function getAlchemySepoliaUrl(): string | undefined {
	const url =
		process.env.ALCHEMY_SEPOLIA_URL ??
		process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL;
	return url?.trim() || undefined;
}

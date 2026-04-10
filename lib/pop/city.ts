import { keccak256, stringToBytes } from "viem";

import type { PopCityId } from "./cities";

export function normalizeCity(city: string): string {
	return city.trim().toLowerCase();
}

/** `cityId` must be a POP city slug (e.g. lucknow) — same bytes on-chain. */
export function hashCity(cityId: PopCityId | string): `0x${string}` {
	const n = normalizeCity(cityId);
	return keccak256(stringToBytes(n));
}

/** Match Solidity: keccak256(abi.encodePacked(code)) — use trimmed meet code as entered */
export function hashMeetCode(code: string): `0x${string}` {
	return keccak256(stringToBytes(code.trim()));
}

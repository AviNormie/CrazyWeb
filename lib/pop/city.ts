import { keccak256, stringToBytes } from "viem";

/** Match Solidity: keccak256(abi.encodePacked(normalizedCity)) — UTF-8 bytes */
export function normalizeCity(city: string): string {
	return city.trim().toLowerCase();
}

export function hashCity(city: string): `0x${string}` {
	const n = normalizeCity(city);
	return keccak256(stringToBytes(n));
}

/** Match Solidity: keccak256(abi.encodePacked(code)) — use trimmed meet code as entered */
export function hashMeetCode(code: string): `0x${string}` {
	return keccak256(stringToBytes(code.trim()));
}

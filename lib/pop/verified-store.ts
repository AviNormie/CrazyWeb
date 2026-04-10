import { normalizeCity } from "./city";

/** In-memory verified wallets per normalized city key (resets on server restart). */
const verifiedByCity = new Map<string, Set<string>>();

export function getVerifiedSet(city: string): Set<string> {
	const key = normalizeCity(city);
	let set = verifiedByCity.get(key);
	if (!set) {
		set = new Set();
		verifiedByCity.set(key, set);
	}
	return set;
}

export function addVerified(city: string, address: `0x${string}`): number {
	const set = getVerifiedSet(city);
	const lower = address.toLowerCase() as `0x${string}`;
	set.add(lower);
	return set.size;
}

export function verifiedCount(city: string): number {
	return getVerifiedSet(city).size;
}

export function isVerified(city: string, address: string): boolean {
	const set = getVerifiedSet(city);
	return set.has(address.toLowerCase() as `0x${string}`);
}

import type { PopCityId } from "./cities";

const verifiedByCity = new Map<PopCityId, Set<string>>();

export function getVerifiedSet(cityId: PopCityId): Set<string> {
	let set = verifiedByCity.get(cityId);
	if (!set) {
		set = new Set();
		verifiedByCity.set(cityId, set);
	}
	return set;
}

export function addVerified(cityId: PopCityId, address: `0x${string}`): number {
	const set = getVerifiedSet(cityId);
	const lower = address.toLowerCase() as `0x${string}`;
	set.add(lower);
	return set.size;
}

export function verifiedCount(cityId: PopCityId): number {
	return getVerifiedSet(cityId).size;
}

export function isVerified(cityId: PopCityId, address: string): boolean {
	return getVerifiedSet(cityId).has(address.toLowerCase() as `0x${string}`);
}

export function listVerifiedAddresses(cityId: PopCityId): string[] {
	return Array.from(getVerifiedSet(cityId)).sort();
}

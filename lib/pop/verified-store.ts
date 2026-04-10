import type { PopCityId } from "./cities";
import { isPopRedisConfigured, popRedisCommand } from "./redis-rest";

const verifiedByCity = new Map<PopCityId, Set<string>>();

function memGetSet(cityId: PopCityId): Set<string> {
	let set = verifiedByCity.get(cityId);
	if (!set) {
		set = new Set();
		verifiedByCity.set(cityId, set);
	}
	return set;
}

function verifiedKey(cityId: PopCityId): string {
	return `pop:v1:ver:${cityId}`;
}

export async function addVerified(
	cityId: PopCityId,
	address: `0x${string}`,
): Promise<number> {
	const lower = address.toLowerCase();
	if (isPopRedisConfigured()) {
		await popRedisCommand<number>(["SADD", verifiedKey(cityId), lower]);
		return popRedisCommand<number>(["SCARD", verifiedKey(cityId)]);
	}
	const set = memGetSet(cityId);
	set.add(lower);
	return set.size;
}

export async function verifiedCount(cityId: PopCityId): Promise<number> {
	if (isPopRedisConfigured()) {
		return popRedisCommand<number>(["SCARD", verifiedKey(cityId)]);
	}
	return memGetSet(cityId).size;
}

export async function isVerified(
	cityId: PopCityId,
	address: string,
): Promise<boolean> {
	const lower = address.toLowerCase();
	if (isPopRedisConfigured()) {
		const n = await popRedisCommand<number>([
			"SISMEMBER",
			verifiedKey(cityId),
			lower,
		]);
		return n === 1;
	}
	return memGetSet(cityId).has(lower);
}

export async function listVerifiedAddresses(
	cityId: PopCityId,
): Promise<string[]> {
	if (isPopRedisConfigured()) {
		const members = await popRedisCommand<string[]>([
			"SMEMBERS",
			verifiedKey(cityId),
		]);
		return [...members].sort();
	}
	return Array.from(memGetSet(cityId)).sort();
}

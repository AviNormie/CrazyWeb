import { createHmac } from "node:crypto";

import type { PopCityId } from "./cities";

/** Deterministic meet code: HMAC-SHA256(secret, cityId:day) → first 8 hex chars (uppercase). */
export function deriveDailyCode(
	secret: string,
	cityId: PopCityId,
	dayForCode: number,
): string {
	const h = createHmac("sha256", secret);
	h.update(`${cityId}:${dayForCode}`);
	return h.digest("hex").slice(0, 8).toUpperCase();
}

/** Day index used for code derivation: chain day 0 (session not started) → use 1. */
export function codeDayFromChainCurrentDay(chainDay: number): number {
	if (chainDay <= 0) return 1;
	if (chainDay > 7) return 7;
	return chainDay;
}

import { createHmac } from "node:crypto";

import { normalizeCity } from "./city";

/** Deterministic meet code: first 8 hex chars (uppercase) of HMAC-SHA256(secret, city:day). */
export function deriveDailyCode(
	secret: string,
	city: string,
	dayForCode: number,
): string {
	const cityKey = normalizeCity(city);
	const h = createHmac("sha256", secret);
	h.update(`${cityKey}:${dayForCode}`);
	return h.digest("hex").slice(0, 8).toUpperCase();
}

/** Day index used for code derivation: chain day 0 (session not started) → use 1. */
export function codeDayFromChainCurrentDay(chainDay: number): number {
	if (chainDay <= 0) return 1;
	if (chainDay > 7) return 7;
	return chainDay;
}

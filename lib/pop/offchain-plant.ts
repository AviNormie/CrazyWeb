import type { PopCityId } from "./cities";

type Row = {
	sessionStartMs: number;
	lastWateredDay: number;
	completed: boolean;
};

const plants = new Map<PopCityId, Row>();
const nonces = new Map<string, bigint>();

export function offchainSecondsPerDay(): number {
	const n = Number(
		process.env.POP_SECONDS_PER_DAY ?? process.env.SECONDS_PER_DAY ?? "30",
	);
	return Number.isFinite(n) && n > 0 ? n : 30;
}

function getRow(cityId: PopCityId): Row {
	return plants.get(cityId) ?? { sessionStartMs: 0, lastWateredDay: 0, completed: false };
}

export function offchainPlantSnapshot(cityId: PopCityId): Row {
	return { ...getRow(cityId) };
}

/** Mirrors on-chain `getCurrentDay` before any water: 0; after session start: 1–7. */
export function offchainCurrentDay(cityId: PopCityId): number {
	const p = getRow(cityId);
	if (p.completed) return 7;
	if (p.sessionStartMs === 0) return 0;
	const elapsed = (Date.now() - p.sessionStartMs) / 1000;
	const spd = offchainSecondsPerDay();
	let d = Math.floor(elapsed / spd) + 1;
	if (d > 7) d = 7;
	return d;
}

export function offchainGetNonce(user: string): bigint {
	return nonces.get(user.toLowerCase()) ?? BigInt(0);
}

/**
 * Same ordering as `waterPlant`: nonce++, set `sessionStart` if first tx, then day / sequence checks.
 */
export function offchainWaterPlant(
	cityId: PopCityId,
	user: string,
	dayArg: number,
): | { ok: true; currentDay: number; lastWateredDay: number; completed: boolean }
	| { ok: false; error: string } {
	const p = getRow(cityId);
	if (p.completed) return { ok: false, error: "completed" };

	const u = user.toLowerCase();
	nonces.set(u, (nonces.get(u) ?? BigInt(0)) + BigInt(1));

	let sessionStart = p.sessionStartMs;
	if (sessionStart === 0) sessionStart = Date.now();
	const mid: Row = { ...p, sessionStartMs: sessionStart };
	plants.set(cityId, mid);

	const current = offchainCurrentDay(cityId);
	if (current < 1 || current > 7) {
		return { ok: false, error: "plant cannot be watered this day" };
	}
	if (dayArg !== current) {
		return { ok: false, error: "day does not match current day" };
	}

	const lp = mid.lastWateredDay;
	if (!((lp === 0 && dayArg === 1) || lp + 1 === dayArg)) {
		return { ok: false, error: "wrong watering sequence" };
	}

	mid.lastWateredDay = dayArg;
	if (dayArg === 7) mid.completed = true;
	plants.set(cityId, mid);
	return {
		ok: true,
		currentDay: current,
		lastWateredDay: mid.lastWateredDay,
		completed: mid.completed,
	};
}

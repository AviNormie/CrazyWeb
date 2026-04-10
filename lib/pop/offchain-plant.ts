import type { PopCityId } from "./cities";
import { isPopRedisConfigured, popRedisCommand } from "./redis-rest";

export type OffchainPlantRow = {
	sessionStartMs: number;
	lastWateredDay: number;
	completed: boolean;
};

const plants = new Map<PopCityId, OffchainPlantRow>();
const nonces = new Map<string, bigint>();

function plantKey(cityId: PopCityId): string {
	return `pop:v1:plant:${cityId}`;
}

function nonceKey(user: string): string {
	return `pop:v1:nonce:${user.toLowerCase()}`;
}

const EMPTY_ROW: OffchainPlantRow = {
	sessionStartMs: 0,
	lastWateredDay: 0,
	completed: false,
};

export function offchainSecondsPerDay(): number {
	const n = Number(
		process.env.POP_SECONDS_PER_DAY ?? process.env.SECONDS_PER_DAY ?? "30",
	);
	return Number.isFinite(n) && n > 0 ? n : 30;
}

function memRow(cityId: PopCityId): OffchainPlantRow {
	return plants.get(cityId) ?? { ...EMPTY_ROW };
}

async function loadRow(cityId: PopCityId): Promise<OffchainPlantRow> {
	if (!isPopRedisConfigured()) {
		return memRow(cityId);
	}
	const raw = await popRedisCommand<string | null>(["GET", plantKey(cityId)]);
	if (!raw) return { ...EMPTY_ROW };
	try {
		const j = JSON.parse(raw) as OffchainPlantRow;
		return {
			sessionStartMs: Number(j.sessionStartMs) || 0,
			lastWateredDay: Number(j.lastWateredDay) || 0,
			completed: Boolean(j.completed),
		};
	} catch {
		return { ...EMPTY_ROW };
	}
}

async function saveRow(cityId: PopCityId, row: OffchainPlantRow): Promise<void> {
	if (isPopRedisConfigured()) {
		await popRedisCommand<string>([
			"SET",
			plantKey(cityId),
			JSON.stringify(row),
		]);
		return;
	}
	plants.set(cityId, { ...row });
}

export async function offchainPlantSnapshot(
	cityId: PopCityId,
): Promise<OffchainPlantRow> {
	const r = await loadRow(cityId);
	return { ...r };
}

export async function offchainCurrentDay(cityId: PopCityId): Promise<number> {
	const p = await loadRow(cityId);
	if (p.completed) return 7;
	if (p.sessionStartMs === 0) return 0;
	const elapsed = (Date.now() - p.sessionStartMs) / 1000;
	const spd = offchainSecondsPerDay();
	let d = Math.floor(elapsed / spd) + 1;
	if (d > 7) d = 7;
	return d;
}

export async function offchainGetNonce(user: string): Promise<bigint> {
	const u = user.toLowerCase();
	if (isPopRedisConfigured()) {
		const v = await popRedisCommand<string | null>(["GET", nonceKey(u)]);
		if (v == null) return BigInt(0);
		try {
			return BigInt(v);
		} catch {
			return BigInt(0);
		}
	}
	return nonces.get(u) ?? BigInt(0);
}

async function bumpNonce(user: string): Promise<void> {
	const u = user.toLowerCase();
	if (isPopRedisConfigured()) {
		await popRedisCommand<number>(["INCR", nonceKey(u)]);
		return;
	}
	nonces.set(u, (nonces.get(u) ?? BigInt(0)) + BigInt(1));
}

export type OffchainWaterPlantResult =
	| { ok: true; currentDay: number; lastWateredDay: number; completed: boolean }
	| { ok: false; error: string };

export async function offchainWaterPlant(
	cityId: PopCityId,
	user: string,
	dayArg: number,
): Promise<OffchainWaterPlantResult> {
	const p = await loadRow(cityId);
	if (p.completed) return { ok: false, error: "completed" };

	await bumpNonce(user);

	let sessionStart = p.sessionStartMs;
	if (sessionStart === 0) sessionStart = Date.now();
	const mid: OffchainPlantRow = { ...p, sessionStartMs: sessionStart };
	await saveRow(cityId, mid);

	const current = await offchainCurrentDay(cityId);
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
	await saveRow(cityId, mid);
	return {
		ok: true,
		currentDay: current,
		lastWateredDay: mid.lastWateredDay,
		completed: mid.completed,
	};
}

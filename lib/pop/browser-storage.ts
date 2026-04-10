import { parsePopCityId, type PopCityId } from "./cities";

const LS_LAST_CITY = "pop:v1:lastCity";

function meetDraftKey(cityId: PopCityId): string {
	return `pop:v1:meetDraft:${cityId}`;
}

function safeGet(key: string): string | null {
	try {
		if (typeof window === "undefined") return null;
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function safeSet(key: string, value: string): void {
	try {
		if (typeof window === "undefined") return;
		localStorage.setItem(key, value);
	} catch {
		/* quota / private mode */
	}
}

function safeRemove(key: string): void {
	try {
		if (typeof window === "undefined") return;
		localStorage.removeItem(key);
	} catch {
		/* ignore */
	}
}

/** Last city chosen on `/pop` (validated against allowed cities). */
export function loadLastCityId(): PopCityId | null {
	return parsePopCityId(safeGet(LS_LAST_CITY));
}

export function saveLastCityId(cityId: PopCityId | ""): void {
	if (!cityId) {
		safeRemove(LS_LAST_CITY);
		return;
	}
	safeSet(LS_LAST_CITY, cityId);
}

/** Draft meet code for a room (persists across refresh; keyed per city). */
export function loadMeetCodeDraft(cityId: PopCityId): string {
	return safeGet(meetDraftKey(cityId)) ?? "";
}

export function saveMeetCodeDraft(cityId: PopCityId, code: string): void {
	const key = meetDraftKey(cityId);
	const t = code.trim();
	if (!t) {
		safeRemove(key);
		return;
	}
	safeSet(key, t);
}

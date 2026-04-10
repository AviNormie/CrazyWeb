/**
 * Allowed cities. On-chain `cityHash` = keccak256(utf8 bytes of `id`).
 */
export const POP_CITIES = [
	{ id: "lucknow", label: "Lucknow" },
	{ id: "mumbai", label: "Mumbai" },
	{ id: "delhi", label: "Delhi" },
	{ id: "bengaluru", label: "Bengaluru" },
	{ id: "hyderabad", label: "Hyderabad" },
	{ id: "chennai", label: "Chennai" },
	{ id: "kolkata", label: "Kolkata" },
	{ id: "pune", label: "Pune" },
	{ id: "ahmedabad", label: "Ahmedabad" },
	{ id: "jaipur", label: "Jaipur" },
] as const;

export type PopCityId = (typeof POP_CITIES)[number]["id"];

const ID_SET = new Set<string>(POP_CITIES.map((c) => c.id));

export const POP_CITY_IDS: PopCityId[] = POP_CITIES.map((c) => c.id);

export function parsePopCityId(
	raw: string | null | undefined,
): PopCityId | null {
	if (!raw?.trim()) return null;
	const id = raw.trim().toLowerCase();
	if (!ID_SET.has(id)) return null;
	return id as PopCityId;
}

export function labelForCityId(id: PopCityId): string {
	return POP_CITIES.find((c) => c.id === id)?.label ?? id;
}

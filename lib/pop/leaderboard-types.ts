import type { PopCityId } from "./cities";

export type LeaderboardCityRow = {
	cityId: PopCityId;
	label: string;
	verifiedCount: number;
	lastWateredDay: number;
	currentDay: number;
	completed: boolean;
	plantSource: "chain" | "offchain";
	score: number;
};

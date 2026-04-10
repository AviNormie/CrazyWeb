import { buildLeaderboardRows } from "@/lib/pop/leaderboard-data";

export const runtime = "nodejs";

export async function GET() {
	const cities = await buildLeaderboardRows();
	return Response.json({
		updatedAt: Date.now(),
		cities,
	});
}

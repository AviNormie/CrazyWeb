import { parsePopCityId } from "@/lib/pop/cities";
import { isPopDemoAdvanceDayEnabled } from "@/lib/pop/demo-flags";
import { offchainDemoAdvanceStage } from "@/lib/pop/offchain-plant";

export const runtime = "nodejs";

export async function POST(req: Request) {
	if (!isPopDemoAdvanceDayEnabled()) {
		return Response.json({ error: "not available" }, { status: 404 });
	}

	let body: { city?: string };
	try {
		body = await req.json();
	} catch {
		return Response.json({ error: "invalid json" }, { status: 400 });
	}

	const cityId = parsePopCityId(body.city);
	if (!cityId) {
		return Response.json({ error: "invalid city" }, { status: 400 });
	}

	const r = await offchainDemoAdvanceStage(cityId);
	if (!r.ok) {
		return Response.json({ error: r.error }, { status: 409 });
	}

	return Response.json({
		ok: true,
		lastWateredDay: r.lastWateredDay,
		currentDay: r.currentDay,
		completed: r.completed,
	});
}

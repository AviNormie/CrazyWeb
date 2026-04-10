/** When true, `POST /api/pop/demo-advance-day` and the room “Demo: next stage” control are enabled. */
export function isPopDemoAdvanceDayEnabled(): boolean {
	return (
		process.env.POP_DEMO_ADVANCE_DAY === "true" ||
		process.env.NODE_ENV === "development"
	);
}

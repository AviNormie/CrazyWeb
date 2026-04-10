/**
 * On-chain `getCurrentDay` is 0 before the first `waterPlant`. Inside that tx,
 * session starts and the required `day` argument is 1. Use this for client/API agreement.
 */
export function wateringDayForTx(
	rawCurrentDay: number,
	lastWateredDay: number,
): number {
	if (rawCurrentDay === 0 && lastWateredDay === 0) return 1;
	return rawCurrentDay;
}

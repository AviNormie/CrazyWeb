/**
 * Upstash Redis over HTTPS — works on Vercel serverless with one shared store.
 * Create a free DB at https://upstash.com → copy REST URL + token into Vercel env.
 */

export function isPopRedisConfigured(): boolean {
	return Boolean(
		process.env.UPSTASH_REDIS_REST_URL?.trim() &&
			process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
	);
}

export async function popRedisCommand<T = unknown>(
	command: (string | number)[],
): Promise<T> {
	const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
	const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
	if (!url || !token) {
		throw new Error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN required");
	}
	const res = await fetch(url, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(command),
		cache: "no-store",
	});
	if (!res.ok) {
		const t = await res.text();
		throw new Error(`Upstash Redis HTTP ${res.status}: ${t}`);
	}
	const data = (await res.json()) as { result: T };
	return data.result;
}

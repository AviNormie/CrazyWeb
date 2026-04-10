"use client";

import Link from "next/link";
import { Crown, Flame, Swords, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { LeaderboardCityRow } from "@/lib/pop/leaderboard-types";

import { usePopPresentation } from "./presentation-context";

type Payload = {
	updatedAt: number;
	cities: LeaderboardCityRow[];
};

function rankStyle(rank: number) {
	if (rank === 1)
		return "border-amber-400/50 bg-gradient-to-br from-amber-500/15 via-black/40 to-black/40 shadow-[0_0_40px_-8px_rgba(245,158,11,0.35)]";
	if (rank === 2)
		return "border-white/25 bg-gradient-to-br from-zinc-400/10 via-black/40 to-black/40";
	if (rank === 3)
		return "border-orange-400/30 bg-gradient-to-br from-orange-700/15 via-black/40 to-black/40";
	return "border-white/10 bg-black/35";
}

export function PopLeaderboard() {
	const { stealth } = usePopPresentation();

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["pop-leaderboard"],
		queryFn: async () => {
			const r = await fetch("/api/pop/leaderboard");
			const json = (await r.json().catch(() => ({}))) as Payload & {
				error?: string;
			};
			if (!r.ok) {
				throw new Error(
					typeof json.error === "string" ? json.error : `HTTP ${r.status}`,
				);
			}
			return json;
		},
		refetchInterval: 12_000,
	});

	return (
		<div className="mx-auto max-w-3xl px-4 pb-24 pt-10 md:max-w-4xl md:pt-14">
			<div className="mb-10 text-center">
				<div className="mb-3 inline-flex items-center gap-2 text-emerald-400/90">
					<Swords className="h-8 w-8" aria-hidden />
					<Flame className="h-6 w-6 text-orange-400/90" aria-hidden />
				</div>
				<h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
					City showdown
				</h1>
				<p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/60 md:text-base">
					{stealth
						? "Rooms compete on presence, growth, and who finishes the seven-day run first."
						: "Who’s winning the hackathon streets? Ranked by plant progress, completion, and verified headcount — same rules for every city."}
				</p>
			</div>

			{isLoading && (
				<p className="text-center text-sm text-white/45">Loading standings…</p>
			)}
			{isError && (
				<p className="text-center text-sm text-red-300">
					{error instanceof Error ? error.message : "Could not load leaderboard."}
				</p>
			)}

			{data?.cities ? (
				<ol className="space-y-4">
					{data.cities.map((row, i) => {
						const rank = i + 1;
						const growthPct = (row.lastWateredDay / 7) * 100;
						return (
							<li key={row.cityId}>
								<Card
									className={`backdrop-blur-md transition hover:border-emerald-500/25 ${rankStyle(rank)}`}
								>
									<CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
										<div className="flex items-start gap-3">
											<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/50 font-mono text-lg font-semibold text-white/90">
												{rank === 1 ? (
													<Crown
														className="h-5 w-5 text-amber-300"
														aria-label="First place"
													/>
												) : (
													rank
												)}
											</span>
											<div>
												<CardTitle className="text-lg text-white">
													{row.label}
												</CardTitle>
												<CardDescription className="mt-1 text-white/50">
													{row.completed ? (
														<span className="text-emerald-300/90">
															Run complete · champions
														</span>
													) : (
														<span>
															Day {row.currentDay} · last watered{" "}
															{row.lastWateredDay}/7
														</span>
													)}{" "}
													<span className="text-white/35">
														· {row.plantSource === "chain" ? "On-chain" : "Room"}
													</span>
												</CardDescription>
											</div>
										</div>
										<Link
											href={`/pop/${row.cityId}/room`}
											className="shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/25"
										>
											Enter room
										</Link>
									</CardHeader>
									<CardContent className="space-y-3 pt-0">
										<div className="flex flex-wrap items-center gap-4 text-xs text-white/55">
											<span className="inline-flex items-center gap-1.5">
												<Users className="h-3.5 w-3.5 text-emerald-400/80" />
												{row.verifiedCount} verified
											</span>
										</div>
										<div
											className="h-2 overflow-hidden rounded-full bg-white/10"
											role="progressbar"
											aria-valuenow={row.lastWateredDay}
											aria-valuemin={0}
											aria-valuemax={7}
											aria-label={`Growth ${row.lastWateredDay} of 7`}
										>
											<div
												className={`h-full rounded-full transition-all ${
													row.completed
														? "bg-gradient-to-r from-amber-400 to-emerald-400"
														: "bg-gradient-to-r from-emerald-600 to-teal-500"
												}`}
												style={{
													width: `${Math.min(100, growthPct)}%`,
												}}
											/>
										</div>
									</CardContent>
								</Card>
							</li>
						);
					})}
				</ol>
			) : null}

			{data?.updatedAt ? (
				<p className="mt-8 text-center text-[11px] text-white/35">
					Auto-refreshes · last snapshot {new Date(data.updatedAt).toLocaleTimeString()}
				</p>
			) : null}
		</div>
	);
}

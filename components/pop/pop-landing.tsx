"use client";

import Link from "next/link";
import { MapPin, Sprout, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { loadLastCityId, saveLastCityId } from "@/lib/pop/browser-storage";
import { labelForCityId, POP_CITIES, type PopCityId } from "@/lib/pop/cities";
import { connectBrowserWallet } from "@/lib/pop/wallet-connect";

import { PopPlantVisual } from "./pop-plant-visual";
import { usePopPresentation } from "./presentation-context";

const NEEDS = [
	{
		icon: Users,
		title: "Coordination is hard",
		body: "Study groups, meetups, and hackathon crews need a lightweight way to confirm everyone actually showed up — without another spreadsheet.",
		bodyPublic:
			"Teams and communities need a simple, trustworthy way to confirm who actually showed up — without another spreadsheet.",
	},
	{
		icon: MapPin,
		title: "Place matters",
		body: "Presence should be tied to a real city and a shared moment. A short meet code proves you were there that day.",
		bodyPublic:
			"Presence is tied to a city and a shared moment. A short meet code shows you were part of that day.",
	},
	{
		icon: Sprout,
		title: "Shared progress",
		body: "When enough people verify, the room waters a shared plant together — seven days of presence, then a small celebration for everyone who stuck with it.",
		bodyPublic:
			"When your group verifies together, you water a shared plant — seven days of showing up, then a small celebration for everyone who stuck with it.",
	},
] as const;

const NEEDS_INTRO =
	"Something simple for groups who meet in the real world and want a credible, low-friction signal that people were there.";

export function PopLanding() {
	const { stealth } = usePopPresentation();
	const router = useRouter();
	const [cityId, setCityId] = useState<PopCityId | "">("");
	const [toast, setToast] = useState<string | null>(null);

	useEffect(() => {
		const saved = loadLastCityId();
		if (saved) setCityId(saved);
	}, []);

	useEffect(() => {
		saveLastCityId(cityId);
	}, [cityId]);

	const { address, isConnected } = useAccount();
	const {
		connectAsync,
		connectors,
		isPending: connectPending,
		error: connectError,
		reset: resetConnect,
	} = useConnect();
	const { disconnect } = useDisconnect();

	const browserConnector = useMemo(() => {
		return (
			connectors.find((c) => c.id === "injected") ??
			connectors.find((c) => c.ready) ??
			connectors[0]
		);
	}, [connectors]);

	function onEnterRoom() {
		setToast(null);
		if (!cityId) {
			setToast("Pick a city first.");
			return;
		}
		if (!isConnected) {
			setToast("Connect your wallet first.");
			return;
		}
		router.push(`/pop/${cityId}/room`);
	}

	return (
		<div className="dark mx-auto max-w-6xl px-4 pb-20 text-white">
			<section className="grid gap-12 pt-10 md:grid-cols-2 md:items-center md:gap-14 md:pt-14 lg:pt-16">
				<div className="space-y-6">
					<p className="text-xs font-medium tracking-[0.2em] text-emerald-400/90 uppercase">
						Proof of presence
					</p>
					<h1 className="text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl">
						Grow a plant from{" "}
						<span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
							real meetups
						</span>
						.
					</h1>
					<p className="max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
						Choose your city, join the room with your wallet, and confirm with
						today’s shared code from your host or group chat. When enough people
						show up, you water the tree together — day by day — until the run is
						complete.
					</p>
					<p className="text-sm">
						<Link
							href="/pop/leaderboard"
							className="font-medium text-emerald-300/95 underline decoration-emerald-500/35 underline-offset-4 transition hover:text-emerald-200"
						>
							City leaderboard — who’s ahead?
						</Link>
					</p>
				</div>

				<Card className="border-white/10 bg-card/40 shadow-xl shadow-black/30 ring-1 ring-white/[0.06] backdrop-blur-xl">
					<CardHeader className="space-y-1 border-b border-border/50 pb-5">
						<CardTitle className="text-lg text-card-foreground">
							Your city room
						</CardTitle>
						<CardDescription className="text-muted-foreground">
							Pick a city, connect a wallet, then enter the shared room.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-5 pt-6">
						<div className="flex flex-col items-center border-b border-border/40 pb-6 md:flex-row md:justify-between md:gap-6">
							<PopPlantVisual
								lastWateredDay={0}
								completed={false}
								caption="your room grows here"
								className="scale-90 md:scale-100"
							/>
						</div>

						<div className="space-y-2">
							<label
								htmlFor="pop-city"
								className="text-xs font-medium tracking-wide text-emerald-200/80 uppercase"
							>
								City
							</label>
							<select
								id="pop-city"
								value={cityId}
								onChange={(e) =>
									setCityId((e.target.value as PopCityId | "") || "")
								}
								className="flex h-11 w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm text-foreground ring-offset-background transition focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none"
							>
								<option value="">Choose a city…</option>
								{POP_CITIES.map((c) => (
									<option key={c.id} value={c.id}>
										{c.label}
									</option>
								))}
							</select>
						</div>

						<div className="flex flex-wrap items-center gap-3">
							{!isConnected ? (
								<button
									type="button"
									onClick={() => {
										void (async () => {
											resetConnect();
											setToast(null);
											const r = await connectBrowserWallet(
												connectAsync,
												browserConnector,
											);
											if (!r.ok) setToast(r.message);
										})();
									}}
									disabled={connectPending}
									className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-400 disabled:opacity-50"
								>
									{connectPending ? "Connecting…" : "Connect wallet"}
								</button>
							) : (
								<>
									<span className="max-w-[200px] truncate rounded-full border border-border bg-muted/30 px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
										{address}
									</span>
									<button
										type="button"
										onClick={() => disconnect()}
										className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted/50"
									>
										Disconnect
									</button>
								</>
							)}
						</div>

						{connectError && (
							<p className="text-sm text-red-400">{connectError.message}</p>
						)}
						{toast && !connectError && (
							<p className="text-sm text-amber-200">{toast}</p>
						)}

						<button
							type="button"
							onClick={onEnterRoom}
							disabled={!cityId || !isConnected}
							className="w-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/50 transition hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40"
						>
							Enter room
							{cityId ? ` — ${labelForCityId(cityId)}` : ""}
						</button>

						<p className="text-center text-[11px] text-muted-foreground">
							{cityId ? (
								<Link
									href={`/pop/${cityId}/room`}
									className="text-emerald-400 hover:underline"
								>
									/pop/{cityId}/room
								</Link>
							) : (
								"Choose a city to see the room link"
							)}
						</p>
					</CardContent>
				</Card>
			</section>

			<section className="mt-20 md:mt-28">
				<h2 className="mb-2 text-center text-xs font-medium tracking-[0.25em] text-white/45 uppercase">
					The need
				</h2>
				<p className="mx-auto mb-12 max-w-2xl text-center text-xl font-medium text-white/90 md:text-2xl">
					{NEEDS_INTRO}
				</p>
				<ul className="grid gap-6 md:grid-cols-3 md:gap-5">
					{NEEDS.map(({ icon: Icon, title, body, bodyPublic }) => (
						<li key={title} className="list-none">
							<Card className="group relative h-full overflow-hidden border-white/10 bg-card/35 shadow-lg shadow-black/25 ring-1 ring-white/[0.06] backdrop-blur-md transition-all duration-300 hover:border-emerald-500/30 hover:shadow-emerald-950/25 hover:ring-emerald-500/20">
								<div
									className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.08] via-transparent to-teal-600/[0.05] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
									aria-hidden
								/>
								<CardHeader className="relative space-y-4 pb-2">
									<div className="flex items-start gap-4">
										<div
											className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/25 transition group-hover:bg-emerald-500/20 group-hover:ring-emerald-400/35"
											aria-hidden
										>
											<Icon className="h-6 w-6" strokeWidth={1.75} />
										</div>
										<div className="min-w-0 flex-1 space-y-2 pt-0.5">
											<CardTitle className="text-lg text-card-foreground">
												{title}
											</CardTitle>
											<CardDescription className="text-[15px] leading-relaxed text-muted-foreground">
												{stealth ? bodyPublic : body}
											</CardDescription>
										</div>
									</div>
								</CardHeader>
							</Card>
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}

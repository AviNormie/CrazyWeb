"use client";

import Link from "next/link";
import { MapPin, Sprout, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";

import { labelForCityId, POP_CITIES, type PopCityId } from "@/lib/pop/cities";

import { PopPlantVisual } from "./pop-plant-visual";

const CONTRACT = process.env.NEXT_PUBLIC_POP_CONTRACT_ADDRESS as
	| `0x${string}`
	| undefined;

const NEEDS = [
	{
		icon: Users,
		title: "Coordination is hard",
		body: "Study groups, meetups, and hackathon crews need a lightweight way to confirm everyone actually showed up — without another spreadsheet.",
	},
	{
		icon: MapPin,
		title: "Place matters",
		body: "Presence should be tied to a real city and a shared moment. A short meet code proves you were there that day.",
	},
	{
		icon: Sprout,
		title: "Shared progress",
		body: "When enough people verify, the room “waters” a plant together — seven days of presence, then celebration (on-chain when you enable it).",
	},
] as const;

export function PopLanding() {
	const router = useRouter();
	const [cityId, setCityId] = useState<PopCityId | "">("");
	const [toast, setToast] = useState<string | null>(null);

	const { address, isConnected } = useAccount();
	const {
		connect,
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
		<div className="mx-auto max-w-6xl px-4 pb-20">
			<section className="grid gap-12 pt-10 md:grid-cols-2 md:items-center md:gap-14 md:pt-14 lg:pt-16">
				<div className="space-y-6">
					<p className="text-xs font-medium tracking-[0.2em] text-emerald-400/90 uppercase">
						Hackathon proof of presence
					</p>
					<h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl lg:text-6xl">
						Grow a plant from{" "}
						<span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
							real meetups
						</span>
						.
					</h1>
					<p className="max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
						Pick a city room, verify with today&apos;s code, and water the tree
						when your group is ready. Works as a polished server demo; Sepolia +
						contract kick in automatically when configured.
					</p>
				</div>

				<div className="rounded-2xl border border-white/10 bg-black/40 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-md md:p-8">
					<div className="flex flex-col items-center border-b border-white/10 pb-6 md:flex-row md:justify-between md:gap-6">
						<PopPlantVisual
							lastWateredDay={0}
							completed={false}
							caption="your room grows here"
							className="scale-90 md:scale-100"
						/>
					</div>

					<div className="space-y-5 pt-6">
						<div className="space-y-2">
							<label className="block text-xs font-medium tracking-wide text-emerald-200/70 uppercase">
								City
							</label>
							<select
								value={cityId}
								onChange={(e) =>
									setCityId((e.target.value as PopCityId | "") || "")
								}
								className="w-full rounded-xl border border-white/15 bg-black/50 px-4 py-3 text-sm text-white outline-none ring-emerald-500/25 transition focus:ring-2"
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
										resetConnect();
										if (browserConnector) {
											connect({ connector: browserConnector });
										} else {
											setToast(
												"No browser wallet found. Install MetaMask and refresh.",
											);
										}
									}}
									disabled={connectPending}
									className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-400 disabled:opacity-50"
								>
									{connectPending ? "Connecting…" : "Connect wallet"}
								</button>
							) : (
								<>
									<span className="max-w-[200px] truncate rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-white/85">
										{address}
									</span>
									<button
										type="button"
										onClick={() => disconnect()}
										className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
									>
										Disconnect
									</button>
								</>
							)}
						</div>

						{connectError && (
							<p className="text-sm text-red-300">{connectError.message}</p>
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

						<p className="text-center text-[11px] text-white/40">
							{cityId ? (
								<>
									<Link
										href={`/pop/${cityId}/room`}
										className="text-emerald-400/90 hover:underline"
									>
										/pop/{cityId}/room
									</Link>
								</>
							) : (
								"Choose a city to see the room link"
							)}
						</p>
					</div>
				</div>
			</section>

			<section className="mt-20 md:mt-28">
				<h2 className="mb-2 text-center text-xs font-medium tracking-[0.25em] text-white/45 uppercase">
					The need
				</h2>
				<p className="mx-auto mb-12 max-w-2xl text-center text-xl font-medium text-white/90 md:text-2xl">
					Something simple for groups who meet in the real world and want a
					credible, low-friction signal that people were there.
				</p>
				<ul className="grid gap-6 md:grid-cols-3">
					{NEEDS.map(({ icon: Icon, title, body }) => (
						<li
							key={title}
							className="group rounded-2xl border border-white/10 bg-black/35 p-6 shadow-[0_0_0_1px_rgba(16,185,129,0.08)_inset] backdrop-blur-sm transition hover:border-emerald-500/25 hover:bg-black/45"
						>
							<div className="mb-4 inline-flex rounded-xl bg-emerald-500/15 p-3 text-emerald-300 ring-1 ring-emerald-400/20 transition group-hover:bg-emerald-500/20">
								<Icon className="h-6 w-6" aria-hidden />
							</div>
							<h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
							<p className="text-sm leading-relaxed text-white/60">{body}</p>
						</li>
					))}
				</ul>
			</section>

			<section className="mt-16 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 backdrop-blur-sm md:mt-20 md:px-8 md:py-7">
				<p className="text-sm leading-relaxed text-white/65">
					<strong className="font-medium text-emerald-200/90">Setup:</strong>{" "}
					<code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-emerald-300/90">
						DAILY_CODE_SECRET
					</code>{" "}
					is required for meet codes. Blockchain is optional: add contract +
					RPC + a valid{" "}
					<code className="rounded bg-black/40 px-1.5 py-0.5 text-xs">
						COORDINATOR_PRIVATE_KEY
					</code>{" "}
					when you&apos;re ready for Sepolia.{" "}
					{CONTRACT ? (
						<span className="text-emerald-300/80">
							Public contract env detected — rooms may submit txs in chain mode.
						</span>
					) : null}
				</p>
			</section>
		</div>
	);
}

"use client";

import Link from "next/link";
import { Droplets, FastForward, HeartHandshake } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
	useAccount,
	useConnect,
	useDisconnect,
	useReadContract,
	useWaitForTransactionReceipt,
	useWriteContract,
} from "wagmi";

import { popContractAbi } from "@/lib/pop/abi";
import { hashCity } from "@/lib/pop/city";
import { loadMeetCodeDraft, saveMeetCodeDraft } from "@/lib/pop/browser-storage";
import { labelForCityId, type PopCityId } from "@/lib/pop/cities";
import { connectBrowserWallet } from "@/lib/pop/wallet-connect";

import { PopPlantVisual } from "./pop-plant-visual";
import { usePopPresentation } from "./presentation-context";

const CONTRACT = process.env.NEXT_PUBLIC_POP_CONTRACT_ADDRESS as
	| `0x${string}`
	| undefined;

type SessionPayload = {
	cityId: PopCityId;
	cityLabel: string;
	verifiedCount: number;
	verifiedAddresses: string[];
	currentDay: number;
	canWater: boolean;
	completed: boolean;
	lastWateredDay: number;
	minVerified: number;
	mode: "chain" | "offchain";
	wateringDay: number;
	demoAdvanceDayAvailable?: boolean;
};

export function PopRoom({ cityId }: { cityId: PopCityId }) {
	const { stealth } = usePopPresentation();
	const [code, setCode] = useState("");
	const [toast, setToast] = useState<string | null>(null);
	const [demoAdvancing, setDemoAdvancing] = useState(false);
	const queryClient = useQueryClient();

	const { address, isConnected } = useAccount();
	const {
		connectAsync,
		connectors,
		isPending: connectPending,
		error: connectError,
		reset: resetConnect,
	} = useConnect();

	const browserConnector = useMemo(() => {
		return (
			connectors.find((c) => c.id === "injected") ??
			connectors.find((c) => c.ready) ??
			connectors[0]
		);
	}, [connectors]);

	const { disconnect } = useDisconnect();

	useEffect(() => {
		setCode(loadMeetCodeDraft(cityId));
	}, [cityId]);

	const cityHash = useMemo(() => hashCity(cityId), [cityId]);
	const cityLabel = labelForCityId(cityId);

	const {
		data: session,
		error: sessionError,
		isError: sessionIsError,
	} = useQuery({
		queryKey: ["pop-session", cityId],
		queryFn: async () => {
			const r = await fetch(
				`/api/pop/session?city=${encodeURIComponent(cityId)}`,
			);
			const data = (await r.json().catch(() => ({}))) as {
				error?: string;
			} & Partial<SessionPayload>;
			if (!r.ok) {
				throw new Error(
					typeof data.error === "string" ? data.error : `HTTP ${r.status}`,
				);
			}
			return data as SessionPayload;
		},
		refetchInterval: 4000,
	});

	const chainReadsEnabled = Boolean(
		CONTRACT && session?.mode === "chain",
	);

	const { data: chainDay, refetch: refetchDay } = useReadContract({
		address: CONTRACT,
		abi: popContractAbi,
		functionName: "getCurrentDay",
		args: cityHash ? [cityHash] : undefined,
		query: { enabled: Boolean(cityHash && chainReadsEnabled) },
	});

	const { data: plant, refetch: refetchPlant } = useReadContract({
		address: CONTRACT,
		abi: popContractAbi,
		functionName: "plants",
		args: cityHash ? [cityHash] : undefined,
		query: { enabled: Boolean(cityHash && chainReadsEnabled) },
	});

	const completed = session?.completed ?? plant?.[2] ?? false;
	const lastWatered = session?.lastWateredDay ?? (plant ? Number(plant[1]) : 0);
	const dayOnChain =
		chainReadsEnabled && chainDay !== undefined ? Number(chainDay) : null;

	const {
		writeContract,
		data: txHash,
		isPending: writePending,
		error: writeErr,
	} = useWriteContract();

	const { isLoading: confirming, isSuccess: txSuccess } =
		useWaitForTransactionReceipt({
			hash: txHash,
		});

	const canWaterUi =
		Boolean(session?.canWater) &&
		isConnected &&
		address &&
		code.trim().length > 0;

	async function onDemoAdvanceStage() {
		setToast(null);
		setDemoAdvancing(true);
		try {
			const r = await fetch("/api/pop/demo-advance-day", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ city: cityId }),
			});
			const data = (await r.json().catch(() => ({}))) as {
				error?: string;
				completed?: boolean;
				lastWateredDay?: number;
			};
			if (!r.ok) {
				setToast(typeof data.error === "string" ? data.error : "Could not advance.");
				return;
			}
			setToast(
				data.completed
					? "Plant is complete — all stages unlocked for this city."
					: `Advanced to stage ${data.lastWateredDay ?? ""} of 7.`,
			);
			await queryClient.invalidateQueries({ queryKey: ["pop-session", cityId] });
		} finally {
			setDemoAdvancing(false);
		}
	}

	async function onVerify() {
		setToast(null);
		if (!address) {
			setToast("Connect wallet first");
			return;
		}
		const r = await fetch("/api/pop/verify", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ city: cityId, code, address }),
		});
		const data = await r.json().catch(() => ({}));
		if (!r.ok) {
			setToast(typeof data.error === "string" ? data.error : await r.text());
			return;
		}
		setToast(`Verified. Total verified: ${data.verifiedCount}`);
		await queryClient.invalidateQueries({ queryKey: ["pop-session", cityId] });
	}

	async function onHint() {
		setToast(null);
		const r = await fetch(`/api/pop/hint?city=${encodeURIComponent(cityId)}`);
		if (!r.ok) {
			setToast("Code hint isn’t available for this room right now.");
			return;
		}
		const j = await r.json();
		setToast(
			`Today’s code: ${j.code}`,
		);
	}

	async function onWater() {
		setToast(null);
		const wd = session?.wateringDay;
		if (!address || !cityHash || wd === undefined) return;

		const r = await fetch("/api/pop/sign-water", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				city: cityId,
				address,
				code,
				day: wd,
			}),
		});
		const data = (await r.json().catch(() => ({}))) as {
			error?: string;
			mode?: string;
			signature?: string;
			codeHash?: `0x${string}`;
			chainDay?: number;
			completed?: boolean;
			simulatedMint?: boolean;
		};

		if (!r.ok) {
			setToast(typeof data.error === "string" ? data.error : await r.text());
			return;
		}

		if (data.mode === "offchain") {
			setToast(
				data.simulatedMint
					? "Amazing — you finished all seven days. The plant is complete."
					: "Water recorded. The plant grows with your group.",
			);
			await queryClient.invalidateQueries({ queryKey: ["pop-session", cityId] });
			return;
		}

		if (!CONTRACT || !data.signature || !data.codeHash) {
			setToast(
				"Connection to the network isn’t available in this browser build.",
			);
			return;
		}

		writeContract({
			address: CONTRACT,
			abi: popContractAbi,
			functionName: "waterPlant",
			args: [
				cityHash,
				Number(data.chainDay),
				data.codeHash,
				data.signature as `0x${string}`,
			],
		});
	}

	useEffect(() => {
		if (txSuccess) {
			void refetchDay();
			void refetchPlant();
			void queryClient.invalidateQueries({ queryKey: ["pop-session", cityId] });
		}
	}, [txSuccess, refetchDay, refetchPlant, queryClient, cityId]);

	const verifiedList = session?.verifiedAddresses ?? [];

	return (
		<div className="mx-auto max-w-6xl px-4 pb-20 text-white">
			<div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 py-6">
				<div>
					<Link
						href="/pop"
						className="text-sm font-medium text-emerald-300/90 hover:text-emerald-200"
					>
						← All cities
					</Link>
					<p className="mt-2 text-xs tracking-wide text-white/40 uppercase">
						Room
					</p>
					<h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
						{cityLabel}
						<span className="ml-2 font-mono text-base font-normal text-white/40">
							({cityId})
						</span>
					</h1>
				</div>
				<div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-[11px] backdrop-blur-sm">
					<span className="text-emerald-300/95">
						{session?.mode === "chain" ? "Live · synced" : "Live"}
					</span>
					<span className="text-white/30">·</span>
					<span className="text-white/50">
						{session?.verifiedCount ?? "—"} verified
					</span>
				</div>
			</div>

			<p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/65 md:text-base">
				<span className="inline-flex items-center gap-1.5 text-emerald-200/90">
					<HeartHandshake className="h-4 w-4 shrink-0" aria-hidden />
					<strong className="font-medium">The need:</strong>
				</span>{" "}
				Small groups need a simple way to show they actually met. This room uses a
				daily code for your city — once two wallets verify, you can water together
				and grow the tree through seven days.
			</p>

			<div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
				<div className="space-y-6">
					{!stealth && session?.mode === "chain" && !CONTRACT && (
						<div className="rounded-2xl border border-amber-500/35 bg-amber-950/20 px-4 py-3 text-sm text-amber-100/95 backdrop-blur-sm">
							Add{" "}
							<code className="text-xs">NEXT_PUBLIC_POP_CONTRACT_ADDRESS</code> in
							the browser env so MetaMask can submit transactions.
						</div>
					)}

					<div className="rounded-2xl border border-white/10 bg-black/35 p-5 shadow-[0_0_0_1px_rgba(16,185,129,0.06)_inset] backdrop-blur-md md:p-6">
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
									className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-emerald-900/35 hover:bg-emerald-400 disabled:opacity-50"
								>
									{connectPending ? "Connecting…" : "Connect wallet"}
								</button>
							) : (
								<>
									<span className="max-w-[220px] truncate rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[11px] text-white/85">
										{address}
									</span>
									<button
										type="button"
										onClick={() => disconnect()}
										className="rounded-full border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10"
									>
										Disconnect
									</button>
								</>
							)}
						</div>
						{(connectError || sessionIsError) && (
							<p className="mt-3 text-sm text-red-300">
								{connectError?.message ??
									(sessionError instanceof Error
										? sessionError.message
										: "Session error")}
							</p>
						)}

						<div className="mt-6 space-y-2">
							<label className="block text-xs font-medium tracking-wide text-emerald-200/70 uppercase">
								Meet code
							</label>
							<input
								value={code}
								onChange={(e) => {
									const v = e.target.value;
									setCode(v);
									saveMeetCodeDraft(cityId, v);
								}}
								placeholder="8-character code from someone in the room"
								className="w-full rounded-xl border border-white/15 bg-black/45 px-4 py-3 text-sm outline-none ring-emerald-500/25 transition focus:ring-2"
								autoComplete="off"
								spellCheck={false}
							/>
							<p className="text-xs leading-relaxed text-white/50">
								Get it from whoever is running the meetup (in person or in your
								group chat). Everyone in {cityLabel} shares the same code for the
								current plant day; it can change as the week advances. If your
								host enabled it here,{" "}
								<span className="text-white/65">Show today’s code</span> may
								also work.
							</p>
						</div>

						<div className="mt-4 flex flex-wrap gap-3">
							<button
								type="button"
								onClick={() => void onVerify()}
								disabled={!isConnected || !code.trim()}
								className="rounded-full border border-emerald-400/45 bg-emerald-500/10 px-5 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-40"
							>
								Verify presence
							</button>
							<button
								type="button"
								onClick={() => void onHint()}
								className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/75 hover:bg-white/10"
							>
								Show today’s code
							</button>
						</div>
					</div>

					<div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur-sm">
						<p className="mb-3 text-xs font-medium tracking-wide text-white/50 uppercase">
							Verified in {cityLabel}
						</p>
						{verifiedList.length === 0 ? (
							<p className="text-sm text-white/45">
								No verified wallets yet. Share the code IRL first.
							</p>
						) : (
							<ul className="max-h-36 space-y-2 overflow-y-auto font-mono text-xs">
								{verifiedList.map((a) => (
									<li
										key={a}
										className="truncate rounded-lg border border-white/5 bg-white/[0.03] px-2 py-1.5 text-emerald-200/90"
									>
										{a}
									</li>
								))}
							</ul>
						)}
					</div>

					<button
						type="button"
						onClick={() => void onWater()}
						disabled={!canWaterUi || writePending || confirming}
						className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/40 transition hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40"
					>
						<Droplets className="h-4 w-4" aria-hidden />
						{session?.mode === "chain" && (writePending || confirming)
							? "Confirm in wallet…"
							: "Water plant"}
					</button>

					{(toast || writeErr) && (
						<p className="text-sm text-amber-200">
							{toast}
							{writeErr ? ` ${writeErr.message}` : ""}
						</p>
					)}

					{txHash && session?.mode === "chain" && (
						<p className="break-all text-xs text-white/45">
							Tx: {txHash}
							{txSuccess ? " — confirmed" : confirming ? " — confirming…" : ""}
						</p>
					)}
				</div>

				<aside className="space-y-6 lg:sticky lg:top-24">
					<div className="rounded-2xl border border-white/10 bg-black/40 p-6 shadow-[0_0_40px_-10px_rgba(16,185,129,0.25)] backdrop-blur-md">
						<p className="mb-4 text-center text-[11px] tracking-[0.2em] text-white/45 uppercase">
							Collective plant
						</p>
						<PopPlantVisual
							lastWateredDay={lastWatered}
							completed={completed}
							caption={`${cityLabel} room`}
						/>
					</div>

					<div className="rounded-2xl border border-white/10 bg-black/35 p-5 text-sm backdrop-blur-sm">
						<div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
							<div className="text-white/50">Verified</div>
							<div className="font-mono text-right">
								{session?.verifiedCount ?? "—"} / {session?.minVerified ?? 2}
							</div>
							<div className="text-white/50">Plant day</div>
							<div className="font-mono text-right">
								{session?.currentDay ?? "—"}
							</div>
							<div className="text-white/50">Watering day</div>
							<div className="font-mono text-right">
								{session?.wateringDay ?? "—"}
							</div>
							<div className="text-white/50">Reference</div>
							<div className="font-mono text-right">
								{session?.mode === "chain" ? (dayOnChain ?? "—") : "—"}
							</div>
							<div className="text-white/50">Last watered</div>
							<div className="font-mono text-right">{lastWatered}</div>
							<div className="text-white/50">Status</div>
							<div className="text-right font-mono text-emerald-200/85">
								{completed ? "Complete" : "Growing"}
							</div>
						</div>
					</div>

					{session?.demoAdvanceDayAvailable && !completed ? (
						<div className="rounded-2xl border border-amber-500/30 bg-amber-950/25 p-4 shadow-[0_0_0_1px_rgba(245,158,11,0.08)_inset] backdrop-blur-sm">
							<p className="mb-2 text-[10px] font-medium tracking-[0.2em] text-amber-200/80 uppercase">
								{stealth ? "Preview" : "Demo"}
							</p>
							<button
								type="button"
								onClick={() => void onDemoAdvanceStage()}
								disabled={demoAdvancing}
								className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/15 px-3 py-2.5 text-xs font-semibold text-amber-100 transition hover:bg-amber-500/25 disabled:opacity-50"
							>
								<FastForward className="h-3.5 w-3.5" aria-hidden />
								{demoAdvancing
									? "Advancing…"
									: stealth
										? "Next plant stage"
										: "Next plant stage (skip water)"}
							</button>
							<p className="mt-2 text-[11px] leading-relaxed text-white/45">
								{stealth
									? "Off-chain rooms only. Advances the shared visual for this city."
									: "Off-chain only: grows the plant one step and aligns the calendar so meet codes match the next day—no wallet tx."}
							</p>
						</div>
					) : null}
				</aside>
			</div>
		</div>
	);
}

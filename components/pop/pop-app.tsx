"use client";

import { useQuery } from "@tanstack/react-query";
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

const CONTRACT = process.env.NEXT_PUBLIC_POP_CONTRACT_ADDRESS as
	| `0x${string}`
	| undefined;

export function PopApp() {
	const [city, setCity] = useState("");
	const [code, setCode] = useState("");
	const [toast, setToast] = useState<string | null>(null);

	const { address, isConnected } = useAccount();
	const {
		connect,
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

	const cityHash = useMemo(
		() => (city.trim() ? hashCity(city) : undefined),
		[city],
	);

	const {
		data: session,
		error: sessionError,
		isError: sessionIsError,
	} = useQuery({
		queryKey: ["pop-session", city],
		enabled: city.trim().length > 0,
		queryFn: async () => {
			const r = await fetch(
				`/api/pop/session?city=${encodeURIComponent(city)}`,
			);
			const data = (await r.json().catch(() => ({}))) as {
				error?: string;
				verifiedCount?: number;
				currentDay?: number;
				canWater?: boolean;
				completed?: boolean;
				lastWateredDay?: number;
				minVerified?: number;
			};
			if (!r.ok) {
				throw new Error(
					typeof data.error === "string" ? data.error : `HTTP ${r.status}`,
				);
			}
			return data as {
				verifiedCount: number;
				currentDay: number;
				canWater: boolean;
				completed: boolean;
				lastWateredDay: number;
				minVerified: number;
			};
		},
		refetchInterval: 4000,
	});

	const { data: chainDay, refetch: refetchDay } = useReadContract({
		address: CONTRACT,
		abi: popContractAbi,
		functionName: "getCurrentDay",
		args: cityHash ? [cityHash] : undefined,
		query: { enabled: Boolean(CONTRACT && cityHash) },
	});

	const { data: plant, refetch: refetchPlant } = useReadContract({
		address: CONTRACT,
		abi: popContractAbi,
		functionName: "plants",
		args: cityHash ? [cityHash] : undefined,
		query: { enabled: Boolean(CONTRACT && cityHash) },
	});

	const completed = plant?.[2] ?? false;
	const lastWatered = plant ? Number(plant[1]) : 0;
	const dayOnChain = chainDay !== undefined ? Number(chainDay) : null;

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
		!completed &&
		dayOnChain !== null &&
		dayOnChain >= 1 &&
		dayOnChain <= 7 &&
		code.trim().length > 0;

	async function onVerify() {
		setToast(null);
		if (!address) {
			setToast("Connect wallet first");
			return;
		}
		const r = await fetch("/api/pop/verify", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ city, code, address }),
		});
		const data = await r.json().catch(() => ({}));
		if (!r.ok) {
			setToast(typeof data.error === "string" ? data.error : await r.text());
			return;
		}
		setToast(`Verified. Total verified: ${data.verifiedCount}`);
	}

	async function onHint() {
		setToast(null);
		const r = await fetch(`/api/pop/hint?city=${encodeURIComponent(city)}`);
		if (!r.ok) {
			setToast("Hint unavailable (set POP_SHOW_CODE=true or use dev)");
			return;
		}
		const j = await r.json();
		setToast(`Demo code: ${j.code}`);
	}

	async function onWater() {
		setToast(null);
		if (!address || !cityHash || dayOnChain === null || !CONTRACT) return;
		const r = await fetch("/api/pop/sign-water", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				city,
				address,
				code,
				day: dayOnChain,
			}),
		});
		const data = await r.json();
		if (!r.ok) {
			setToast(data.error ?? (await r.text()));
			return;
		}
		writeContract({
			address: CONTRACT,
			abi: popContractAbi,
			functionName: "waterPlant",
			args: [
				cityHash,
				Number(data.chainDay),
				data.codeHash as `0x${string}`,
				data.signature as `0x${string}`,
			],
		});
	}

	useEffect(() => {
		if (txSuccess) {
			void refetchDay();
			void refetchPlant();
		}
	}, [txSuccess, refetchDay, refetchPlant]);

	return (
		<div className="mx-auto max-w-lg space-y-6 px-4 py-10 text-white">
			<div>
				<h1 className="text-2xl font-semibold tracking-tight">
					Proof of Presence Plant
				</h1>
				<p className="mt-1 text-sm text-white/70">
					Meet IRL, share today&apos;s city code (1 simulated day = 30s on
					chain). Two verified wallets unlock watering through day 7 — then
					an NFT mints.
				</p>
			</div>

			{!CONTRACT && (
				<p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
					Set <code className="text-xs">NEXT_PUBLIC_POP_CONTRACT_ADDRESS</code>{" "}
					after deploying the contract.
				</p>
			)}

			<div className="flex flex-wrap items-center gap-2">
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
						className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-50"
					>
						{connectPending ? "Connecting…" : "Connect wallet (MetaMask)"}
					</button>
				) : (
					<>
						<span className="truncate text-xs text-white/80">{address}</span>
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
				<p className="text-sm text-red-300">
					{connectError?.message ??
						(sessionError instanceof Error
							? sessionError.message
							: "Session error")}
				</p>
			)}

			<div className="space-y-2">
				<label className="block text-xs font-medium text-white/60">City</label>
				<input
					value={city}
					onChange={(e) => setCity(e.target.value)}
					placeholder="e.g. san francisco"
					className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
				/>
			</div>

			<div className="space-y-2">
				<label className="block text-xs font-medium text-white/60">
					Meet code (from friend or hint)
				</label>
				<input
					value={code}
					onChange={(e) => setCode(e.target.value)}
					placeholder="8-character code"
					className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
				/>
			</div>

			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					onClick={() => void onVerify()}
					disabled={!isConnected || !city.trim() || !code.trim()}
					className="rounded-full border border-emerald-400/50 px-4 py-2 text-sm hover:bg-emerald-500/20 disabled:opacity-40"
				>
					Verify presence
				</button>
				<button
					type="button"
					onClick={() => void onHint()}
					disabled={!city.trim()}
					className="rounded-full border border-white/20 px-4 py-2 text-xs hover:bg-white/10 disabled:opacity-40"
				>
					Demo hint
				</button>
			</div>

			<div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
				<div className="grid grid-cols-2 gap-2">
					<div className="text-white/60">Verified users</div>
					<div className="font-mono">
						{session?.verifiedCount ?? "—"} / {session?.minVerified ?? 2}{" "}
						min
					</div>
					<div className="text-white/60">API session day</div>
					<div className="font-mono">{session?.currentDay ?? "—"}</div>
					<div className="text-white/60">On-chain day</div>
					<div className="font-mono">{dayOnChain ?? "—"}</div>
					<div className="text-white/60">Last watered day</div>
					<div className="font-mono">{lastWatered}</div>
					<div className="text-white/60">Plant</div>
					<div className="font-mono">{completed ? "Complete + NFT" : "Growing"}</div>
				</div>
			</div>

			<button
				type="button"
				onClick={() => void onWater()}
				disabled={!canWaterUi || writePending || confirming}
				className="w-full rounded-full bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
			>
				{writePending || confirming ? "Confirm in wallet…" : "Water plant"}
			</button>

			{(toast || writeErr) && (
				<p className="text-sm text-amber-200">
					{toast}
					{writeErr ? ` ${writeErr.message}` : ""}
				</p>
			)}

			{txHash && (
				<p className="break-all text-xs text-white/50">
					Tx: {txHash}
					{txSuccess ? " — confirmed" : confirming ? " — confirming…" : ""}
				</p>
			)}
		</div>
	);
}

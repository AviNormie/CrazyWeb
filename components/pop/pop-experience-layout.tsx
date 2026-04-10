"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { SmokeBackground } from "@/components/ui/smokeAnimation";

import { usePopPresentation } from "./presentation-context";

type Props = {
	children: ReactNode;
	/** When false, skip WebGL smoke (e.g. reduced motion) — still uses gradients */
	ambient?: boolean;
};

export function PopExperienceLayout({ children, ambient = true }: Props) {
	const { stealth } = usePopPresentation();
	return (
		<div className="relative min-h-screen overflow-x-hidden bg-black text-white">
			<div className="fixed inset-0 z-0" aria-hidden>
				{ambient ? (
					<SmokeBackground
						smokeColor="#10B981"
						backgroundColor="#000000"
						className="absolute inset-0 h-full w-full opacity-90"
					/>
				) : null}
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_70%_at_50%_0%,_rgba(16,185,129,0.18)_0%,_transparent_50%,_#000_100%)]" />
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black" />
				<div className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_80%_at_50%_50%,_transparent_35%,_rgba(0,0,0,0.85)_100%)]" />
			</div>

			<header className="relative z-20 border-b border-white/10 bg-black/35 px-4 py-3 backdrop-blur-md">
				<nav className="mx-auto flex max-w-6xl items-center justify-between gap-4">
					<Link
						href="/"
						className="text-sm font-medium text-emerald-300/95 transition hover:text-emerald-200"
					>
						← Home
					</Link>
					<span className="hidden text-[11px] tracking-[0.2em] text-white/45 uppercase sm:block">
						{stealth ? "Presence" : "Proof of Presence"}
					</span>
					<Link
						href="/pop"
						className="text-sm text-white/65 transition hover:text-white"
					>
						All cities
					</Link>
				</nav>
			</header>

			<main className="relative z-10">{children}</main>
		</div>
	);
}

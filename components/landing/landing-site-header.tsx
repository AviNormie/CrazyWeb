"use client";

import Link from "next/link";

export function LandingSiteHeader() {
	return (
		<header className="fixed top-0 right-0 left-0 z-[100] border-b border-white/10 bg-black/55 backdrop-blur-md">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
				<Link
					href="/"
					className="text-sm font-semibold tracking-tight text-white transition hover:text-emerald-200"
				>
					Proof of Presence Plant
				</Link>
				<nav
					className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 text-[11px] font-medium text-white/65 sm:gap-x-6 sm:text-xs md:text-sm"
					aria-label="Page sections"
				>
					<a href="#signal" className="transition hover:text-emerald-200">
						Signal
					</a>
					<a href="#connection" className="transition hover:text-emerald-200">
						Connection
					</a>
					<a href="#depth" className="transition hover:text-emerald-200">
						Depth
					</a>
					<Link
						href="/pop"
						className="rounded-full border border-emerald-400/45 bg-emerald-500/15 px-3 py-1.5 text-emerald-200 transition hover:bg-emerald-500/25 sm:px-4 sm:py-2"
					>
						Open app
					</Link>
				</nav>
			</div>
		</header>
	);
}

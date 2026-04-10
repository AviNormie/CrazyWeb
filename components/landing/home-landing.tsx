"use client";

import Link from "next/link";

import { HeroSection } from "@/components/ui/galaxy-interactive-hero-section";
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import { InfiniteHero } from "@/components/ui/infinite-hero";
import { SmokeBackground } from "@/components/ui/smokeAnimation";

import { LandingSiteHeader } from "./landing-site-header";

const CONNECTION_MORPH_TEXTS = [
	"Connect people",
	"Show up together",
	"Presence in the room",
	"Magic is in connection",
];

const ctaLinkClass =
	"pointer-events-auto rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-5 py-2.5 text-sm font-medium text-emerald-100 backdrop-blur-sm transition hover:border-emerald-300/60 hover:bg-emerald-500/25";

const ctaGhostClass =
	"pointer-events-auto rounded-lg border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90 backdrop-blur-sm transition hover:border-white/40 hover:bg-white/10";

export function HomeLanding() {
	return (
		<div className="min-h-screen bg-black text-white">
			<LandingSiteHeader />

			<InfiniteHero
				sectionId="signal"
				title="Presence you can trust"
				description="A calm surface for real-world groups: shared codes, wallets, and a living plant that grows when people actually show up. The product experience lives in Proof of Presence — this page is the doorway."
				className="scroll-mt-[52px]"
			>
				<Link href="/pop" className={ctaLinkClass}>
					Open Proof of Presence
				</Link>
				<a href="#connection" className={ctaGhostClass}>
					Why connection
				</a>
			</InfiniteHero>

			<section
				id="connection"
				className="relative flex min-h-screen scroll-mt-[52px] flex-col items-center justify-center px-6 py-24"
			>
				<SmokeBackground
					smokeColor="#10b981"
					backgroundColor="#000000"
					className="absolute inset-0 h-full w-full opacity-90"
				/>
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_70%_at_50%_20%,rgba(16,185,129,0.2)_0%,transparent_55%)]" />
				<div className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_85%_at_50%_50%,transparent_35%,rgba(0,0,0,0.88)_100%)]" />

				<div className="relative z-10 flex w-full max-w-4xl flex-col items-center text-center">
					<p className="mb-10 text-xs font-medium tracking-[0.28em] text-emerald-300/90 uppercase">
						When we gather
					</p>
					<GooeyText
						texts={CONNECTION_MORPH_TEXTS}
						morphTime={1.15}
						cooldownTime={0.35}
						className="min-h-[260px] w-full md:min-h-[220px]"
						textClassName="font-semibold tracking-tight text-4xl text-emerald-50 sm:text-5xl md:text-6xl [text-shadow:0_0_72px_rgba(16,185,129,0.5),0_0_28px_rgba(45,212,191,0.3)]"
					/>
					<p className="mt-14 max-w-md text-sm leading-relaxed text-white/55 md:text-base">
						Real meetups deserve a simple, dignified signal — not another
						spreadsheet.{" "}
						<Link
							href="/pop"
							className="font-medium text-emerald-300/95 underline decoration-emerald-500/40 underline-offset-4 transition hover:text-emerald-200"
						>
							Start in your city room
						</Link>
						.
					</p>
				</div>
			</section>

			<HeroSection
				omitNavbar
				showScreenshot={false}
				heroTitle={
					<>
						Go deeper <br className="sm:hidden" />
						into the <span className="text-emerald-300">shared room</span>.
					</>
				}
				heroSubtitle="Interactive depth — mouse around, then step into the city flows where wallets, codes, and the plant actually run."
				heroActions={
					<>
						<Link
							href="/pop"
							className="w-full rounded-full border border-emerald-500/40 bg-emerald-600 px-6 py-2 text-center text-sm font-semibold text-black transition hover:bg-emerald-500 sm:w-auto sm:py-3 sm:px-8"
						>
							Launch Proof of Presence
						</Link>
						<a
							href="#signal"
							className="w-full rounded-full border border-gray-500 bg-black/60 px-6 py-2 text-center text-sm font-medium text-gray-200 transition hover:border-emerald-400/50 hover:text-white sm:w-auto sm:py-3 sm:px-8"
						>
							Back to top
						</a>
					</>
				}
				belowFoldTitle="Built for people who show up"
				belowFoldBody="Rooms by city, daily meet codes, verification, and a plant your group waters together — seven days at a time. Everything operational is one click away in the app."
			/>
		</div>
	);
}

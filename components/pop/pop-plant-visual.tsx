"use client";

import { Leaf, Sparkles } from "lucide-react";

type Props = {
	/** Days successfully watered (0–7). */
	lastWateredDay: number;
	completed: boolean;
	className?: string;
	/** Optional subtitle under the graphic */
	caption?: string;
};

/**
 * Stylised tree that grows with plant progress — SVG + CSS, no external assets.
 */
export function PopPlantVisual({
	lastWateredDay,
	completed,
	className = "",
	caption,
}: Props) {
	const growth = completed ? 7 : Math.min(7, Math.max(0, lastWateredDay));
	const canopyR = 28 + growth * 10;
	const trunkH = 40 + growth * 7;
	const opacityLeaf = 0.35 + growth * 0.08;
	const trunkTop = 200 - trunkH;

	return (
		<div
			className={`relative flex flex-col items-center ${className}`}
			role="img"
			aria-label={
				completed
					? "Plant complete — full tree"
					: `Growing plant, day ${growth} of 7`
			}
		>
			<div className="relative flex h-[200px] w-[min(100%,280px)] items-end justify-center">
				{/* ground */}
				<div className="absolute bottom-0 h-2 w-[85%] rounded-full bg-emerald-950/80 blur-sm" />
				<svg
					viewBox="0 0 200 220"
					className="relative z-[1] h-full w-full overflow-visible drop-shadow-[0_0_24px_rgba(52,211,153,0.25)]"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<title>Presence plant</title>
					{/* trunk */}
					<rect
						x="94"
						y={trunkTop}
						width="12"
						height={trunkH}
						rx="3"
						fill="url(#trunk)"
						className="transition-all duration-700 ease-out"
					/>
					<defs>
						<linearGradient id="trunk" x1="0" y1="0" x2="1" y2="1">
							<stop offset="0%" stopColor="#44403c" />
							<stop offset="100%" stopColor="#292524" />
						</linearGradient>
						<radialGradient id="canopy" cx="50%" cy="40%" r="60%">
							<stop offset="0%" stopColor="#34d399" />
							<stop offset="70%" stopColor="#059669" />
							<stop offset="100%" stopColor="#064e3b" />
						</radialGradient>
					</defs>
					{/* canopy layers */}
					<ellipse
						cx="100"
						cy={155 - growth * 4}
						rx={canopyR * 0.45}
						ry={canopyR * 0.38}
						fill="url(#canopy)"
						opacity={opacityLeaf}
						className="transition-all duration-700 ease-out"
					/>
					<ellipse
						cx="88"
						cy={145 - growth * 5}
						rx={canopyR * 0.35}
						ry={canopyR * 0.3}
						fill="#10b981"
						opacity={0.5 + growth * 0.06}
						className="transition-all duration-700 ease-out"
					/>
					<ellipse
						cx="112"
						cy={148 - growth * 4}
						rx={canopyR * 0.32}
						ry={canopyR * 0.28}
						fill="#6ee7b7"
						opacity={0.35 + growth * 0.07}
						className="transition-all duration-700 ease-out"
					/>
					{/* sprout when growth 0 */}
					{growth === 0 && !completed && (
						<path
							d="M100 175 Q92 160 100 150 Q108 160 100 175"
							stroke="#34d399"
							strokeWidth="2"
							fill="none"
							strokeLinecap="round"
							className="animate-pulse"
						/>
					)}
				</svg>

				{completed ? (
					<div className="absolute -top-1 right-[12%] flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium tracking-wide text-amber-200 uppercase">
						<Sparkles className="h-3 w-3" aria-hidden />
						Full growth
					</div>
				) : null}
			</div>

			<div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-200/70">
				<Leaf className="h-3.5 w-3.5 shrink-0 text-emerald-400" aria-hidden />
				<span>
					Stage {growth} / 7
					{caption ? ` · ${caption}` : ""}
				</span>
			</div>
		</div>
	);
}

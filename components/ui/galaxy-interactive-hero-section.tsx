"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useEffect, useRef, useState } from "react";

const Spline = dynamic(() => import("@splinetool/react-spline"), {
	ssr: false,
	loading: () => (
		<div className="absolute inset-0 flex items-center justify-center bg-neutral-950 text-sm text-neutral-500">
			Loading scene…
		</div>
	),
});

function HeroSplineBackground() {
	return (
		<div
			className="relative h-screen w-full overflow-hidden"
			style={{ pointerEvents: "auto" }}
		>
			<Spline
				className="h-screen w-full"
				style={{ pointerEvents: "auto" }}
				scene="https://prod.spline.design/us3ALejTXl6usHZ7/scene.splinecode"
			/>
			<div
				className="pointer-events-none absolute inset-0 h-screen w-full"
				style={{
					background: `
            linear-gradient(to right, rgba(0, 0, 0, 0.8), transparent 30%, transparent 70%, rgba(0, 0, 0, 0.8)),
            linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.9))
          `,
				}}
			/>
		</div>
	);
}

function ScreenshotSection({
	screenshotRef,
}: {
	screenshotRef: React.RefObject<HTMLDivElement | null>;
}) {
	return (
		<section className="relative z-10 container mx-auto mt-11 px-4 md:mt-12 md:px-6 lg:px-8">
			<div
				ref={screenshotRef}
				className="mx-auto w-full overflow-hidden rounded-xl border border-gray-700/50 bg-gray-900 shadow-2xl md:w-[80%] lg:w-[70%]"
			>
				<div className="relative w-full">
					<Image
						src="https://cdn.sanity.io/images/s6lu43cv/production-v4/13b6177b537aee0fc311a867ea938f16416e8670-3840x2160.jpg?w=3840&h=2160&q=10&auto=format&fm=jpg"
						alt="App Screenshot"
						width={3840}
						height={2160}
						className="mx-auto block h-auto w-full rounded-lg"
						sizes="(max-width: 768px) 100vw, 70vw"
						priority={false}
					/>
				</div>
			</div>
		</section>
	);
}

type HeroContentProps = {
	title?: React.ReactNode;
	subtitle?: string;
	actions?: React.ReactNode;
};

function HeroContent({
	title,
	subtitle,
	actions,
}: HeroContentProps) {
	const resolvedTitle =
		title ??
		(
			<>
				Elevate your <br className="sm:hidden" />
				creative workflow
				<br className="sm:hidden" /> to an art form.
			</>
		);
	const resolvedSubtitle =
		subtitle ??
		"Manage all of your media and assets — video, photos, design files, docs, PDFs, and more — on a single secure surface to create and deliver high-quality content faster.";
	const defaultActions = (
		<>
			<button
				type="button"
				className="w-full rounded-full border border-[#322D36] bg-[#8200DB29] px-6 py-2 font-semibold text-white transition duration-300 hover:bg-black/50 sm:w-auto sm:py-3 sm:px-8"
				style={{ backdropFilter: "blur(8px)" }}
			>
				Start Free Trial
			</button>
			<button
				type="button"
				className="pointer-events-auto flex w-full items-center justify-center rounded-full border border-gray-600 bg-[#0009] px-6 py-2 font-medium text-gray-200 transition duration-300 hover:border-gray-400 hover:text-white sm:w-auto sm:py-3 sm:px-8"
			>
				<svg
					className="mr-2 h-4 w-4 sm:h-5 sm:w-5"
					fill="currentColor"
					viewBox="0 0 20 20"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden
				>
					<path
						fillRule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
						clipRule="evenodd"
					/>
				</svg>
				Watch the Video
			</button>
		</>
	);
	return (
		<div className="pointer-events-auto max-w-3xl px-4 pt-16 text-left text-white sm:pt-24 md:pt-32">
			<h1 className="mb-4 text-3xl leading-tight font-bold tracking-wide sm:text-5xl md:text-7xl">
				{resolvedTitle}
			</h1>
			<p className="mb-6 max-w-xl text-base opacity-80 sm:mb-8 sm:text-lg md:text-xl">
				{resolvedSubtitle}
			</p>
			<div className="flex flex-col items-start space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
				{actions ?? defaultActions}
			</div>
		</div>
	);
}

function Navbar() {
	const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [mobileDropdowns, setMobileDropdowns] = useState({
		features: false,
		enterprise: false,
		resources: false,
	});

	const handleMouseEnterNavItem = (item: string) => setHoveredNavItem(item);
	const handleMouseLeaveNavItem = () => setHoveredNavItem(null);

	const toggleMobileMenu = () => {
		setIsMobileMenuOpen((open) => {
			if (open) {
				setMobileDropdowns({
					features: false,
					enterprise: false,
					resources: false,
				});
			}
			return !open;
		});
	};

	const toggleMobileDropdown = (key: keyof typeof mobileDropdowns) => {
		setMobileDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
	};

	const navLinkClass = (itemName: string, extraClasses = "") => {
		const isCurrentItemHovered = hoveredNavItem === itemName;
		const isAnotherItemHovered =
			hoveredNavItem !== null && !isCurrentItemHovered;

		const colorClass = isCurrentItemHovered
			? "text-white"
			: isAnotherItemHovered
				? "text-gray-500"
				: "text-gray-300";

		return `text-sm transition duration-150 ${colorClass} ${extraClasses}`;
	};

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 1024 && isMobileMenuOpen) {
				setIsMobileMenuOpen(false);
				setMobileDropdowns({
					features: false,
					enterprise: false,
					resources: false,
				});
			}
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [isMobileMenuOpen]);

	return (
		<nav
			className="fixed top-0 right-0 left-0 z-20"
			style={{
				backgroundColor: "rgba(13, 13, 24, 0.3)",
				backdropFilter: "blur(8px)",
				WebkitBackdropFilter: "blur(8px)",
				borderRadius: "0 0 15px 15px",
			}}
		>
			<div className="container mx-auto flex items-center justify-between px-4 py-4 md:px-6 lg:px-8">
				<div className="flex items-center space-x-6 lg:space-x-8">
					<div className="text-white" style={{ width: "32px", height: "32px" }}>
						<svg
							width="32"
							height="32"
							viewBox="0 0 32 32"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
							aria-hidden
						>
							<path
								fillRule="evenodd"
								clipRule="evenodd"
								d="M16 32C24.8366 32 32 24.8366 32 16C32 7.16344 24.8366 0 16 0C7.16344 0 0 7.16344 0 16C0 24.8366 7.16344 32 16 32ZM12.4306 9.70695C12.742 9.33317 13.2633 9.30058 13.6052 9.62118L19.1798 14.8165C19.4894 15.1054 19.4894 15.5841 19.1798 15.873L13.6052 21.0683C13.2633 21.3889 12.742 21.3563 12.4306 21.3563V9.70695Z"
								fill="currentColor"
							/>
						</svg>
					</div>

					<div className="hidden items-center space-x-6 lg:flex">
						<div
							className="group relative"
							onMouseEnter={() => handleMouseEnterNavItem("features")}
							onMouseLeave={handleMouseLeaveNavItem}
						>
							<a href="#" className={navLinkClass("features", "flex items-center")}>
								Features
								<svg
									className="ml-1 h-3 w-3 transition-transform duration-200 group-hover:rotate-180"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</a>
							<div
								className="invisible absolute left-0 z-30 mt-2 w-48 rounded-md border border-gray-700/30 bg-black bg-opacity-50 py-2 opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100"
								style={{
									backdropFilter: "blur(8px)",
									WebkitBackdropFilter: "blur(8px)",
								}}
							>
								<a
									href="#"
									className="block px-4 py-2 text-sm text-gray-300 transition duration-150 hover:bg-gray-800/30 hover:text-gray-100"
								>
									Feature 1
								</a>
								<a
									href="#"
									className="block px-4 py-2 text-sm text-gray-300 transition duration-150 hover:bg-gray-800/30 hover:text-gray-100"
								>
									Feature 2
								</a>
								<a
									href="#"
									className="block px-4 py-2 text-sm text-gray-300 transition duration-150 hover:bg-gray-800/30 hover:text-gray-100"
								>
									Feature 3
								</a>
							</div>
						</div>

						<div
							className="group relative"
							onMouseEnter={() => handleMouseEnterNavItem("enterprise")}
							onMouseLeave={handleMouseLeaveNavItem}
						>
							<a
								href="#"
								className={navLinkClass("enterprise", "flex items-center")}
							>
								Enterprise
								<svg
									className="ml-1 h-3 w-3 transition-transform duration-200 group-hover:rotate-180"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</a>
							<div
								className="invisible absolute left-0 z-30 mt-2 w-48 rounded-md border border-gray-700/30 bg-black bg-opacity-50 py-2 opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100"
								style={{
									backdropFilter: "blur(8px)",
									WebkitBackdropFilter: "blur(8px)",
								}}
							>
								<a
									href="#"
									className="block px-4 py-2 text-sm text-gray-300 transition duration-150 hover:bg-gray-800/30 hover:text-gray-100"
								>
									Solution A
								</a>
								<a
									href="#"
									className="block px-4 py-2 text-sm text-gray-300 transition duration-150 hover:bg-gray-800/30 hover:text-gray-100"
								>
									Solution B
								</a>
							</div>
						</div>

						<div
							className="group relative"
							onMouseEnter={() => handleMouseEnterNavItem("resources")}
							onMouseLeave={handleMouseLeaveNavItem}
						>
							<a
								href="#"
								className={navLinkClass("resources", "flex items-center")}
							>
								Resources
								<svg
									className="ml-1 h-3 w-3 transition-transform duration-200 group-hover:rotate-180"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									aria-hidden
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</a>
							<div
								className="invisible absolute left-0 z-30 mt-2 w-48 rounded-md border border-gray-700/30 bg-black bg-opacity-50 py-2 opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100"
								style={{
									backdropFilter: "blur(8px)",
									WebkitBackdropFilter: "blur(8px)",
								}}
							>
								<a
									href="#"
									className="block px-4 py-2 text-sm text-gray-300 transition duration-150 hover:bg-gray-800/30 hover:text-gray-100"
								>
									Blog
								</a>
								<a
									href="#"
									className="block px-4 py-2 text-sm text-gray-300 transition duration-150 hover:bg-gray-800/30 hover:text-gray-100"
								>
									Docs
								</a>
								<a
									href="#"
									className="block px-4 py-2 text-sm text-gray-300 transition duration-150 hover:bg-gray-800/30 hover:text-gray-100"
								>
									Support
								</a>
							</div>
						</div>

						<a
							href="#"
							className={navLinkClass("pricing")}
							onMouseEnter={() => handleMouseEnterNavItem("pricing")}
							onMouseLeave={handleMouseLeaveNavItem}
						>
							Pricing
						</a>
					</div>
				</div>

				<div className="flex items-center space-x-4 md:space-x-6">
					<a
						href="#"
						className="hidden text-sm text-gray-300 hover:text-white md:block"
					>
						Contact Sales
					</a>
					<a
						href="#"
						className="hidden text-sm text-gray-300 hover:text-white sm:block"
					>
						Sign In
					</a>
					<a
						href="#"
						className="rounded-full border border-[#322D36] bg-[#8200DB29] px-5 py-2 text-sm font-semibold text-white hover:bg-black/50 md:text-base"
						style={{ backdropFilter: "blur(8px)" }}
					>
						Start Free Trial
					</a>
					<button
						type="button"
						className="p-2 text-white lg:hidden"
						onClick={toggleMobileMenu}
						aria-label="Toggle mobile menu"
					>
						<svg
							className="h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							aria-hidden
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d={
									isMobileMenuOpen
										? "M6 18L18 6M6 6l12 12"
										: "M4 6h16M4 12h16M4 18h16"
								}
							/>
						</svg>
					</button>
				</div>
			</div>

			<div
				className={`absolute top-full right-0 left-0 z-30 overflow-hidden border-t border-gray-700/30 bg-black bg-opacity-50 transition-all duration-300 ease-in-out lg:hidden ${
					isMobileMenuOpen
						? "pointer-events-auto max-h-screen opacity-100"
						: "pointer-events-none max-h-0 opacity-0"
				}`}
				style={{
					backdropFilter: "blur(8px)",
					WebkitBackdropFilter: "blur(8px)",
				}}
			>
				<div className="flex flex-col space-y-4 px-4 py-6">
					<div className="relative">
						<button
							type="button"
							className="flex w-full items-center justify-between py-2 text-left text-sm text-gray-300 hover:text-gray-100"
							onClick={() => toggleMobileDropdown("features")}
							aria-expanded={mobileDropdowns.features}
						>
							Features
							<svg
								className={`ml-2 h-3 w-3 transition-transform duration-200 ${mobileDropdowns.features ? "rotate-180" : ""}`}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</button>
						<div
							className={`mt-2 space-y-2 overflow-hidden pl-4 transition-all duration-300 ease-in-out ${mobileDropdowns.features ? "pointer-events-auto max-h-[200px] opacity-100" : "pointer-events-none max-h-0 opacity-0"}`}
						>
							<a
								href="#"
								className="block py-1 text-sm text-gray-300 transition duration-150 hover:text-gray-100"
								onClick={toggleMobileMenu}
							>
								Feature 1
							</a>
							<a
								href="#"
								className="block py-1 text-sm text-gray-300 transition duration-150 hover:text-gray-100"
								onClick={toggleMobileMenu}
							>
								Feature 2
							</a>
							<a
								href="#"
								className="block py-1 text-sm text-gray-300 transition duration-150 hover:text-gray-100"
								onClick={toggleMobileMenu}
							>
								Feature 3
							</a>
						</div>
					</div>
					<div className="relative">
						<button
							type="button"
							className="flex w-full items-center justify-between py-2 text-left text-sm text-gray-300 hover:text-gray-100"
							onClick={() => toggleMobileDropdown("enterprise")}
							aria-expanded={mobileDropdowns.enterprise}
						>
							Enterprise
							<svg
								className={`ml-2 h-3 w-3 transition-transform duration-200 ${mobileDropdowns.enterprise ? "rotate-180" : ""}`}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</button>
						<div
							className={`mt-2 space-y-2 overflow-hidden pl-4 transition-all duration-300 ease-in-out ${mobileDropdowns.enterprise ? "pointer-events-auto max-h-[200px] opacity-100" : "pointer-events-none max-h-0 opacity-0"}`}
						>
							<a
								href="#"
								className="block py-1 text-sm text-gray-300 transition duration-150 hover:text-gray-100"
								onClick={toggleMobileMenu}
							>
								Solution A
							</a>
							<a
								href="#"
								className="block py-1 text-sm text-gray-300 transition duration-150 hover:text-gray-100"
								onClick={toggleMobileMenu}
							>
								Solution B
							</a>
						</div>
					</div>
					<div className="relative">
						<button
							type="button"
							className="flex w-full items-center justify-between py-2 text-left text-sm text-gray-300 hover:text-gray-100"
							onClick={() => toggleMobileDropdown("resources")}
							aria-expanded={mobileDropdowns.resources}
						>
							Resources
							<svg
								className={`ml-2 h-3 w-3 transition-transform duration-200 ${mobileDropdowns.resources ? "rotate-180" : ""}`}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								aria-hidden
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</button>
						<div
							className={`mt-2 space-y-2 overflow-hidden pl-4 transition-all duration-300 ease-in-out ${mobileDropdowns.resources ? "pointer-events-auto max-h-[250px] opacity-100" : "pointer-events-none max-h-0 opacity-0"}`}
						>
							<a
								href="#"
								className="block py-1 text-sm text-gray-300 transition duration-150 hover:text-gray-100"
								onClick={toggleMobileMenu}
							>
								Blog
							</a>
							<a
								href="#"
								className="block py-1 text-sm text-gray-300 transition duration-150 hover:text-gray-100"
								onClick={toggleMobileMenu}
							>
								Docs
							</a>
							<a
								href="#"
								className="block py-1 text-sm text-gray-300 transition duration-150 hover:text-gray-100"
								onClick={toggleMobileMenu}
							>
								Support
							</a>
						</div>
					</div>
					<a
						href="#"
						className="py-2 text-sm text-gray-300 transition duration-150 hover:text-gray-100"
						onClick={toggleMobileMenu}
					>
						Pricing
					</a>
					<a
						href="#"
						className="py-2 text-sm text-gray-300 transition duration-150 hover:text-gray-100"
						onClick={toggleMobileMenu}
					>
						Contact Sales
					</a>
					<a
						href="#"
						className="py-2 text-sm text-gray-300 transition duration-150 hover:text-gray-100"
						onClick={toggleMobileMenu}
					>
						Sign In
					</a>
				</div>
			</div>
		</nav>
	);
}

export type HeroSectionProps = {
	/** When true, skip the template navbar (use a shared site header on the page). */
	omitNavbar?: boolean;
	heroTitle?: React.ReactNode;
	heroSubtitle?: string;
	heroActions?: React.ReactNode;
	belowFoldTitle?: string;
	belowFoldBody?: string;
	/** Set false to hide the screenshot band (e.g. when below-the-fold is custom on the page). */
	showScreenshot?: boolean;
};

export function HeroSection({
	omitNavbar = false,
	heroTitle,
	heroSubtitle,
	heroActions,
	belowFoldTitle = "Other Content Below",
	belowFoldBody = "This is where additional sections of your landing page would go.",
	showScreenshot = true,
}: HeroSectionProps = {}) {
	const screenshotRef = useRef<HTMLDivElement>(null);
	const heroContentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleScroll = () => {
			requestAnimationFrame(() => {
				const scrollPosition = window.scrollY;
				if (screenshotRef.current) {
					screenshotRef.current.style.transform = `translateY(-${scrollPosition * 0.5}px)`;
				}
				if (heroContentRef.current) {
					const maxScroll = 400;
					const opacity = 1 - Math.min(scrollPosition / maxScroll, 1);
					heroContentRef.current.style.opacity = String(opacity);
				}
			});
		};
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<div id="depth" className="relative">
			{!omitNavbar ? <Navbar /> : null}

			<div className="relative h-screen">
				<div className="pointer-events-auto absolute inset-0 z-0">
					<HeroSplineBackground />
				</div>

				<div
					ref={heroContentRef}
					className="pointer-events-none absolute inset-0 z-10 flex h-screen items-center justify-start"
				>
					<div className="container mx-auto w-full">
						<HeroContent
							title={heroTitle}
							subtitle={heroSubtitle}
							actions={heroActions}
						/>
					</div>
				</div>
			</div>

			<div
				className="relative z-10 min-h-screen overflow-y-auto bg-black"
				style={{ marginTop: "-10vh" }}
			>
				{showScreenshot ? <ScreenshotSection screenshotRef={screenshotRef} /> : null}
				<div className="container mx-auto px-4 py-16 text-white">
					<h2 className="mb-8 text-center text-4xl font-bold">{belowFoldTitle}</h2>
					<p className="mx-auto max-w-xl text-center opacity-80">{belowFoldBody}</p>
					<div className="mx-auto mt-10 flex max-w-lg flex-col items-center gap-3 sm:flex-row sm:justify-center">
						<Link
							href="/pop"
							className="rounded-full bg-emerald-500 px-8 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
						>
							Go to Proof of Presence
						</Link>
						<a
							href="#connection"
							className="rounded-full border border-white/20 px-8 py-3 text-sm font-medium text-white/90 transition hover:border-emerald-400/50 hover:text-emerald-200"
						>
							Back to story
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}

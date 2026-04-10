import { HeroSection } from "@/components/ui/galaxy-interactive-hero-section";
import { GooeyText } from "@/components/ui/gooey-text-morphing";
import InfiniteHero from "@/components/ui/infinite-hero";
import { SmokeBackground } from "@/components/ui/smokeAnimation";

const GOOEY_TEXTS = ["Avi", "Is", "Awesome"];

export default function DemoOne() {
	return (
		<>
			<InfiniteHero />
			<section className="relative h-screen w-full bg-black">
				<SmokeBackground
					smokeColor="#DC2626"
					backgroundColor="#000000"
					className="absolute inset-0 h-full w-full"
				/>
				<div className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_80%_at_50%_50%,_transparent_40%,_black_100%)]" />
			</section>
			<section className="flex h-screen w-full items-center justify-center bg-black px-6 py-16 text-white">
				<GooeyText
					texts={GOOEY_TEXTS}
					morphTime={1}
					cooldownTime={0.25}
					className="h-full w-full font-bold"
					textClassName="text-white"
				/>
			</section>
			<HeroSection />
		</>
	);
}
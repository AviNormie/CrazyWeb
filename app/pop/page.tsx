import Link from "next/link";

import { PopApp } from "@/components/pop/pop-app";

export default function PopPage() {
	return (
		<div className="min-h-screen bg-gradient-to-b from-emerald-950 to-black">
			<header className="border-b border-white/10 px-4 py-3">
				<Link href="/" className="text-sm text-emerald-300 hover:underline">
					← Back to demos
				</Link>
			</header>
			<PopApp />
		</div>
	);
}

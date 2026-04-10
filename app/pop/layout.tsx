import type { ReactNode } from "react";

import { PopProviders } from "./providers";

export default function PopLayout({ children }: { children: ReactNode }) {
	const stealthPresentation =
		process.env.VERCEL === "1" &&
		process.env.POP_SHOW_INTERNAL_LABELS !== "true";
	return (
		<PopProviders stealthPresentation={stealthPresentation}>
			{children}
		</PopProviders>
	);
}

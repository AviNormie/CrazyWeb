"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { WagmiProvider } from "wagmi";

import { PopPresentationProvider } from "@/components/pop/presentation-context";
import { wagmiConfig } from "@/lib/pop/wagmi";

export function PopProviders({
	children,
	stealthPresentation = false,
}: {
	children: ReactNode;
	/** When true (default on Vercel), UI reads like a normal product — set POP_SHOW_INTERNAL_LABELS=true to see technical labels. */
	stealthPresentation?: boolean;
}) {
	const [queryClient] = useState(() => new QueryClient());
	return (
		<PopPresentationProvider stealth={stealthPresentation}>
			<WagmiProvider config={wagmiConfig}>
				<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
			</WagmiProvider>
		</PopPresentationProvider>
	);
}

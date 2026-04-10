import { http, createConfig } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected, metaMask } from "wagmi/connectors";

const alchemy =
	process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL ?? process.env.ALCHEMY_SEPOLIA_URL;

export const wagmiConfig = createConfig({
	chains: [sepolia],
	// Injected targets window.ethereum (MetaMask extension, etc.). metaMask() as fallback for SDK flows.
	connectors: [
		injected({ shimDisconnect: true }),
		metaMask(),
	],
	transports: {
		[sepolia.id]: http(alchemy || "https://ethereum-sepolia-rpc.publicnode.com"),
	},
	ssr: true,
});

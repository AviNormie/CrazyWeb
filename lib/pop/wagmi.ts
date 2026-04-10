import { http, createConfig } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

const alchemy =
	process.env.NEXT_PUBLIC_ALCHEMY_SEPOLIA_URL ?? process.env.ALCHEMY_SEPOLIA_URL;

export const wagmiConfig = createConfig({
	chains: [sepolia],
	// Single injected connector avoids MetaMask SDK + extension races that surface as ProviderNotFoundError.
	// `unstable_shimAsyncInject` waits briefly for late `window.ethereum` injection on hard refresh.
	connectors: [
		injected({
			shimDisconnect: true,
			unstable_shimAsyncInject: 1_500,
		}),
	],
	transports: {
		[sepolia.id]: http(alchemy || "https://ethereum-sepolia-rpc.publicnode.com"),
	},
	ssr: true,
});

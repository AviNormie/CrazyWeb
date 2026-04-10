import type { Connector } from "wagmi";

export function hasBrowserEthereumProvider(): boolean {
	if (typeof window === "undefined") return false;
	const eth = (window as Window & { ethereum?: { request?: unknown } })
		.ethereum;
	return typeof eth?.request === "function";
}

/** Maps wagmi/viem connector errors to copy for users without a wallet extension. */
export function walletConnectUserMessage(error: unknown): string | null {
	if (error && typeof error === "object" && "name" in error) {
		const name = String((error as { name: unknown }).name);
		if (name === "ProviderNotFoundError") {
			return "No Ethereum wallet found in this browser. Install MetaMask or another wallet extension, then refresh.";
		}
	}
	return null;
}

export async function connectBrowserWallet(
	connectAsync: (args: { connector: Connector }) => Promise<unknown>,
	connector: Connector | undefined,
): Promise<{ ok: true } | { ok: false; message: string }> {
	if (!connector) {
		return { ok: false, message: "No wallet connector available." };
	}
	if (!hasBrowserEthereumProvider()) {
		return {
			ok: false,
			message:
				"No wallet in this browser yet. Install MetaMask (or a similar wallet), then try again.",
		};
	}
	try {
		await connectAsync({ connector });
		return { ok: true };
	} catch (e) {
		const hint = walletConnectUserMessage(e);
		if (hint) return { ok: false, message: hint };
		const msg =
			e instanceof Error ? e.message : "Could not connect to your wallet.";
		return { ok: false, message: msg };
	}
}

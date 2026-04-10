/** 32-byte hex private key for API EIP-712 signing (64 hex chars). */
export function coordinatorPkHex(): string | null {
	const raw =
		process.env.COORDINATOR_PRIVATE_KEY?.trim().replace(/^0x/i, "") ?? "";
	return /^[\dA-Fa-f]{64}$/.test(raw) ? raw : null;
}

export function hasCoordinatorSigningKey(): boolean {
	return coordinatorPkHex() !== null;
}

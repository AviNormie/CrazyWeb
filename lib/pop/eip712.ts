/**
 * Keep in sync with `blockchain/contracts/ProofOfPresencePlant.sol`
 * (EIP712("ProofOfPresencePlant", "1") and Water struct).
 */

export const POP_EIP712_TYPES = {
	Water: [
		{ name: "user", type: "address" },
		{ name: "cityHash", type: "bytes32" },
		{ name: "day", type: "uint8" },
		{ name: "codeHash", type: "bytes32" },
		{ name: "nonce", type: "uint256" },
	],
} as const;

export function popEip712Domain(
	chainId: number,
	verifyingContract: `0x${string}`,
) {
	return {
		name: "ProofOfPresencePlant",
		version: "1",
		chainId,
		verifyingContract,
	} as const;
}

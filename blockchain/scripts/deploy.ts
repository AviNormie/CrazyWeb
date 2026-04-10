import * as dotenv from "dotenv";
import { ethers } from "hardhat";

dotenv.config();

async function main() {
	const coordinatorAddress =
		process.env.COORDINATOR_ADDRESS ??
		(() => {
			throw new Error("Set COORDINATOR_ADDRESS to the API signer wallet");
		})();

	const secondsPerDay = BigInt(process.env.SECONDS_PER_DAY ?? "30");
	const baseUri = process.env.POP_NFT_BASE_URI ?? "https://pop-plant.hackathon/metadata/";

	const Factory = await ethers.getContractFactory("ProofOfPresencePlant");
	const contract = await Factory.deploy(
		coordinatorAddress,
		secondsPerDay,
		baseUri,
	);
	await contract.waitForDeployment();
	const address = await contract.getAddress();

	console.log("ProofOfPresencePlant deployed to:", address);
	console.log("");
	console.log("Add to .env.local:");
	console.log(`NEXT_PUBLIC_POP_CONTRACT_ADDRESS=${address}`);
	console.log(`POP_CONTRACT_ADDRESS=${address}`);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});

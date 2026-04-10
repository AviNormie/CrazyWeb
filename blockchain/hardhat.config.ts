import * as dotenv from "dotenv";
import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

dotenv.config();

const pk = process.env.DEPLOYER_PRIVATE_KEY;

const config: HardhatUserConfig = {
	solidity: {
		version: "0.8.24",
		settings: {
			optimizer: { enabled: true, runs: 200 },
			evmVersion: "cancun",
		},
	},
	networks: {
		sepolia: {
			url: process.env.ALCHEMY_SEPOLIA_URL ?? "",
			accounts: pk ? [pk] : [],
		},
	},
};

export default config;

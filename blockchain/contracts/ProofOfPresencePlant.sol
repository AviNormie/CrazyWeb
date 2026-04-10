// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/// @title Proof of Presence Plant — hackathon: coordinated off-chain verification + on-chain growth + Day-7 NFT
/// @notice Keep EIP-712 domain/name/version in sync with `lib/pop/eip712.ts` and API signer.
contract ProofOfPresencePlant is ERC721, EIP712 {
	using ECDSA for bytes32;

	uint256 public immutable SECONDS_PER_DAY;
	address public immutable coordinator;

	bytes32 private constant WATER_TYPEHASH =
		keccak256(
			"Water(address user,bytes32 cityHash,uint8 day,bytes32 codeHash,uint256 nonce)"
		);

	struct CityPlant {
		uint64 sessionStart;
		uint8 lastWateredDay;
		bool completed;
	}

	mapping(bytes32 => CityPlant) public plants;
	mapping(bytes32 => mapping(address => bool)) public isParticipant;
	mapping(address => uint256) public nonces;

	uint256 private _nextTokenId;
	string private _baseTokenUri;

	constructor(
		address coordinator_,
		uint256 secondsPerDay_,
		string memory baseUri_
	) ERC721("Proof of Presence Plant", "POPPLANT") EIP712("ProofOfPresencePlant", "1") {
		require(coordinator_ != address(0), "coordinator");
		require(secondsPerDay_ > 0, "seconds");
		coordinator = coordinator_;
		SECONDS_PER_DAY = secondsPerDay_;
		_baseTokenUri = baseUri_;
	}

	function getCurrentDay(bytes32 cityHash) public view returns (uint8) {
		CityPlant storage p = plants[cityHash];
		if (p.sessionStart == 0) return 0;
		if (p.completed) return 7;
		uint256 elapsed = block.timestamp - uint256(p.sessionStart);
		uint256 day = elapsed / SECONDS_PER_DAY + 1;
		if (day > 7) day = 7;
		return uint8(day);
	}

	/// @param cityHash keccak256(abi.encodePacked(normalizedCity))
	/// @param day must match on-chain `getCurrentDay(cityHash)` (1–7)
	/// @param codeHash keccak256(abi.encodePacked(normalized meet code string))
	/// @param signature EIP-712 `Water` struct signed by `coordinator`
	function waterPlant(
		bytes32 cityHash,
		uint8 day,
		bytes32 codeHash,
		bytes calldata signature
	) external {
		require(!plants[cityHash].completed, "completed");

		uint256 nonce = nonces[msg.sender];
		bytes32 structHash = keccak256(
			abi.encode(WATER_TYPEHASH, msg.sender, cityHash, day, codeHash, nonce)
		);
		bytes32 digest = _hashTypedDataV4(structHash);
		require(digest.recover(signature) == coordinator, "bad sig");

		nonces[msg.sender] = nonce + 1;

		CityPlant storage p = plants[cityHash];
		if (p.sessionStart == 0) {
			p.sessionStart = uint64(block.timestamp);
		}

		uint8 current = getCurrentDay(cityHash);
		require(current >= 1 && current <= 7, "day");
		require(day == current, "wrong day");
		require(
			(p.lastWateredDay == 0 && day == 1) || (p.lastWateredDay + 1 == day),
			"sequence"
		);

		p.lastWateredDay = day;
		isParticipant[cityHash][msg.sender] = true;

		if (day == 7) {
			p.completed = true;
			_safeMint(msg.sender, _nextTokenId++);
		}
	}

	function _baseURI() internal view override returns (string memory) {
		return _baseTokenUri;
	}
}

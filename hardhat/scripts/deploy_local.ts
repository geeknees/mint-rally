// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { writeFileSync } from "fs";
import { ethers, upgrades } from "hardhat";
import { MintNFT, EventManager, SecretPhraseVerifier } from "../typechain";

async function main() {
  let mintNFT: MintNFT;
  let eventManager: EventManager;
  let secretPhraseVerifier: SecretPhraseVerifier;

  const ForwarderFactory = await ethers.getContractFactory(
    "MintRallyForwarder"
  );
  const forwarder = await ForwarderFactory.deploy();
  await forwarder.deployed();

  const SecretPhraseVerifierFactory = await ethers.getContractFactory(
    "SecretPhraseVerifier"
  );
  secretPhraseVerifier = await SecretPhraseVerifierFactory.deploy();
  await secretPhraseVerifier.deployed();

  const MintNFTFactory = await ethers.getContractFactory("MintNFT");
  const deployedMintNFT: any = await upgrades.deployProxy(
    MintNFTFactory,
    [forwarder.address, secretPhraseVerifier.address, []],
    {
      initializer: "initialize",
    }
  );
  mintNFT = deployedMintNFT;
  await mintNFT.deployed();

  const EventManagerFactory = await ethers.getContractFactory("EventManager");
  const deployedEventManager: any = await upgrades.deployProxy(
    EventManagerFactory,
    [process.env.LOCAL_RELAYER_ADDRESS, 250000, 1000000],
    {
      initializer: "initialize",
    }
  );
  eventManager = deployedEventManager;
  await eventManager.deployed();

  await mintNFT.setEventManagerAddr(eventManager.address);
  await eventManager.setMintNFTAddr(mintNFT.address);

  console.log("forwarder address:", forwarder.address);
  console.log("secretPhraseVerifier address:", secretPhraseVerifier.address);
  console.log("mintNFT address:", mintNFT.address);
  console.log("eventManager address:", eventManager.address, "\n");
  console.log("----------\nFor frontEnd\n----------");
  console.log(`NEXT_PUBLIC_FORWARDER_ADDRESS=${forwarder.address}`);
  console.log(
    `NEXT_PUBLIC_CONTRACT_SECRET_PHRASE_VERIFIER=${secretPhraseVerifier.address}`
  );
  console.log(`NEXT_PUBLIC_CONTRACT_MINT_NFT_MANAGER=${mintNFT.address}`);
  console.log(`NEXT_PUBLIC_CONTRACT_EVENT_MANAGER=${eventManager.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy MetaVerseToken
  const MetaVerseToken = await hre.ethers.getContractFactory("MetaVerseToken");
  const token = await MetaVerseToken.deploy();
  await token.waitForDeployment();
  console.log("MetaVerseToken deployed to:", await token.getAddress());

  // Deploy MetaVerseNFT
  const MetaVerseNFT = await hre.ethers.getContractFactory("MetaVerseNFT");
  const nft = await MetaVerseNFT.deploy();
  await nft.waitForDeployment();
  console.log("MetaVerseNFT deployed to:", await nft.getAddress());

  // Deploy MetaVerseLand
  const MetaVerseLand = await hre.ethers.getContractFactory("MetaVerseLand");
  const land = await MetaVerseLand.deploy();
  await land.waitForDeployment();
  console.log("MetaVerseLand deployed to:", await land.getAddress());

  // Deploy TimelockController for governance
  const minDelay = 60 * 60 * 24; // 1 day
  const proposers = [deployer.address];
  const executors = [deployer.address];
  const TimelockController = await hre.ethers.getContractFactory("TimelockController");
  const timelock = await TimelockController.deploy(
    minDelay,
    proposers,
    executors,
    deployer.address // admin address
  );
  await timelock.waitForDeployment();
  console.log("TimelockController deployed to:", await timelock.getAddress());

  // Deploy MetaVerseGovernance
  const proposalThreshold = hre.ethers.parseEther("1000"); // 1000 tokens required to create a proposal
  const MetaVerseGovernance = await hre.ethers.getContractFactory("MetaVerseGovernance");
  const governance = await MetaVerseGovernance.deploy(
    await token.getAddress(),
    await timelock.getAddress(),
    proposalThreshold
  );
  await governance.waitForDeployment();
  console.log("MetaVerseGovernance deployed to:", await governance.getAddress());

  // Deploy MetaVerseMarketplace
  const MetaVerseMarketplace = await hre.ethers.getContractFactory("MetaVerseMarketplace");
  const marketplace = await MetaVerseMarketplace.deploy(
    await nft.getAddress(),
    await land.getAddress(),
    await token.getAddress()
  );
  await marketplace.waitForDeployment();
  console.log("MetaVerseMarketplace deployed to:", await marketplace.getAddress());

  // Deploy ChallengeSystem
  const ChallengeSystem = await hre.ethers.getContractFactory("ChallengeSystem");
  const challengeSystem = await ChallengeSystem.deploy(await token.getAddress());
  await challengeSystem.waitForDeployment();
  console.log("ChallengeSystem deployed to:", await challengeSystem.getAddress());

  // Deploy TokenGame
  const TokenGame = await hre.ethers.getContractFactory("TokenGame");
  const tokenGame = await TokenGame.deploy(await token.getAddress());
  await tokenGame.waitForDeployment();
  console.log("TokenGame deployed to:", await tokenGame.getAddress());

  // Set up governance roles
  const proposerRole = await timelock.PROPOSER_ROLE();
  const executorRole = await timelock.EXECUTOR_ROLE();
  const adminRole = await timelock.TIMELOCK_ADMIN_ROLE();

  // Grant proposer role to governance contract
  await timelock.grantRole(proposerRole, await governance.getAddress());
  console.log("Granted proposer role to governance contract");

  // Grant executor role to governance contract
  await timelock.grantRole(executorRole, await governance.getAddress());
  console.log("Granted executor role to governance contract");

  // Revoke admin role from deployer
  await timelock.revokeRole(adminRole, deployer.address);
  console.log("Revoked admin role from deployer");

  console.log("Deployment completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
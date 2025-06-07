const hre = require("hardhat");

async function main() {
  console.log("Deploying MetaVerseToken...");

  // Get the contract factory
  const MetaVerseToken = await hre.ethers.getContractFactory("MetaVerseToken");
  
  // Deploy the contract
  const token = await MetaVerseToken.deploy();

  // Wait for deployment to finish
  await token.waitForDeployment();

  // Get the contract address
  const tokenAddress = await token.getAddress();
  
  console.log("MetaVerseToken deployed to:", tokenAddress);
}

// Handle errors
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
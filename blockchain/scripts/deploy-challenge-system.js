const hre = require("hardhat");

async function main() {
  // Get the token contract address (replace with your deployed token address)
  const tokenAddress = "0xb7bc435345bf3FD3167Ba76d779a5537126b6165"; // Your HSR token address

  // Deploy the ChallengeSystem contract
  const ChallengeSystem = await hre.ethers.getContractFactory("ChallengeSystem");
  const challengeSystem = await ChallengeSystem.deploy(tokenAddress);

  await challengeSystem.deployed();

  console.log("ChallengeSystem deployed to:", challengeSystem.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
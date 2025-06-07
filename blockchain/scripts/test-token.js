const hre = require("hardhat");

async function main() {
  // Get the deployed contract
  const tokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with your deployed contract address
  const MetaVerseToken = await hre.ethers.getContractFactory("MetaVerseToken");
  const token = await MetaVerseToken.attach(tokenAddress);

  // Get the signer (your account)
  const [signer] = await hre.ethers.getSigners();

  // Test token functions
  console.log("Testing token functions...");

  // Get token name and symbol
  const name = await token.name();
  const symbol = await token.symbol();
  console.log(`Token Name: ${name}`);
  console.log(`Token Symbol: ${symbol}`);

  // Get balance of the signer
  const balance = await token.balanceOf(signer.address);
  console.log(`Balance of ${signer.address}: ${balance.toString()}`);

  // Test minting new tokens (only owner can do this)
  console.log("Minting new tokens...");
  const mintAmount = hre.ethers.parseEther("1000"); // 1000 tokens
  await token.mint(signer.address, mintAmount);
  
  // Check new balance
  const newBalance = await token.balanceOf(signer.address);
  console.log(`New Balance: ${newBalance.toString()}`);

  // Test burning tokens
  console.log("Burning tokens...");
  const burnAmount = hre.ethers.parseEther("100"); // 100 tokens
  await token.burn(burnAmount);
  
  // Check final balance
  const finalBalance = await token.balanceOf(signer.address);
  console.log(`Final Balance: ${finalBalance.toString()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Advanced MyToken...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const initialSupply = ethers.parseUnits("1000000", 18); // 1,000,000 tokens
  const MyToken = await ethers.getContractFactory("MyToken");
  
  console.log("Deploying token with initial supply:", ethers.formatUnits(initialSupply, 18), "AMTK");
  
  const myToken = await MyToken.deploy(initialSupply, deployer.address);
  await myToken.waitForDeployment();
  
  const contractAddress = await myToken.getAddress();
  console.log("✅ MyToken deployed to:", contractAddress);
  
  // Display contract information
  console.log("\n📋 Contract Information:");
  console.log("Name:", await myToken.name());
  console.log("Symbol:", await myToken.symbol());
  console.log("Decimals:", await myToken.decimals());
  console.log("Initial Supply:", ethers.formatUnits(await myToken.totalSupply(), 18));
  console.log("Max Supply:", ethers.formatUnits(await myToken.MAX_SUPPLY(), 18));
  console.log("Owner:", await myToken.owner());
  
  // Set up initial configuration
  console.log("\n⚙️ Setting up initial configuration...");
  
  // Add deployer as minter
  await myToken.addMinter(deployer.address);
  console.log("✅ Added deployer as minter");
  
  // Set initial staking reward rate (1% annually)
  await myToken.setStakingRewardRate(100);
  console.log("✅ Set staking reward rate to 1% annually");
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("💡 Remember to:");
  console.log("1. Update the CONTRACT_ADDRESS in your frontend");
  console.log("2. Verify the contract on Etherscan if deploying to mainnet/testnet");
  console.log("3. Update your documentation with the new contract address");
  
  return contractAddress;
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
const { ethers } = require("ethers");

// Your deployed contract address
const CONTRACT_ADDRESS = "0x3905052fB9d1502B246442945Eb1DC9573Be4708";

// Minimal ABI to test basic functions
const ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function owner() view returns (address)",
  "function MAX_SUPPLY() view returns (uint256)"
];

async function verifyContract() {
  try {
    console.log("🔍 Verifying deployed contract at:", CONTRACT_ADDRESS);
    
    // Connect to a public RPC (using Ethereum mainnet)
    const provider = new ethers.JsonRpcProvider("https://cloudflare-eth.com");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    
    console.log("\n📋 Contract Information:");
    
    // Test basic contract functions
    const name = await contract.name();
    console.log("Name:", name);
    
    const symbol = await contract.symbol();
    console.log("Symbol:", symbol);
    
    const decimals = await contract.decimals();
    console.log("Decimals:", decimals.toString());
    
    const totalSupply = await contract.totalSupply();
    console.log("Total Supply:", ethers.formatUnits(totalSupply, decimals), symbol);
    
    const maxSupply = await contract.MAX_SUPPLY();
    console.log("Max Supply:", ethers.formatUnits(maxSupply, decimals), symbol);
    
    const owner = await contract.owner();
    console.log("Owner:", owner);
    
    console.log("\n✅ Contract verification successful!");
    console.log("Your contract is deployed and functioning correctly.");
    
  } catch (error) {
    console.error("❌ Contract verification failed:");
    console.error("Error:", error.message);
    
    if (error.message.includes("network")) {
      console.log("\n💡 Tips:");
      console.log("1. Make sure you're connected to the internet");
      console.log("2. Check if the contract address is correct");
      console.log("3. Verify the contract is deployed on the expected network");
    }
  }
}

verifyContract();

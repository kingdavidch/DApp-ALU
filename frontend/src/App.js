import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";

// Deployed contract address from environment variable or fallback
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "0x3905052fB9d1502B246442945Eb1DC9573Be4708";

// Enhanced ABI for the advanced token contract
const ABI = [
  // ERC20 Standard
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  
  // Advanced Features
  "function mint(address to, uint256 amount)",
  "function burn(uint256 amount)",
  "function stake(uint256 amount)",
  "function unstake(uint256 amount)",
  "function getStakeInfo(address user) view returns (uint256 stakedAmount, uint256 stakingDuration, uint256 pendingReward)",
  "function calculateStakingReward(address user) view returns (uint256)",
  "function releaseVestedTokens()",
  "function getVestingInfo(address beneficiary) view returns (uint256 totalAmount, uint256 releasedAmount, uint256 vestedAmount, uint256 releasableAmount, bool revoked)",
  "function owner() view returns (address)",
  "function minters(address) view returns (bool)",
  "function paused() view returns (bool)",
  "function transferFee() view returns (uint256)",
  "function totalStaked() view returns (uint256)",
  "function MAX_SUPPLY() view returns (uint256)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event TokensStaked(address indexed user, uint256 amount)",
  "event TokensUnstaked(address indexed user, uint256 amount, uint256 reward)",
  "event TokensVested(address indexed beneficiary, uint256 amount)"
];

function App() {
  const [provider, setProvider] = useState();
  const [signer, setSigner] = useState();
  const [account, setAccount] = useState();
  const [contract, setContract] = useState();
  const [balance, setBalance] = useState("0");
  const [decimals, setDecimals] = useState(18);
  const [loading, setLoading] = useState(false);
  
  // Token info
  const [tokenInfo, setTokenInfo] = useState({
    name: "",
    symbol: "",
    totalSupply: "0",
    maxSupply: "0"
  });
  
  // Transfer state
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [txStatus, setTxStatus] = useState("");
  
  // Staking state
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [stakeInfo, setStakeInfo] = useState({
    stakedAmount: "0",
    stakingDuration: "0",
    pendingReward: "0"
  });
  
  // Vesting state
  const [vestingInfo, setVestingInfo] = useState({
    totalAmount: "0",
    releasedAmount: "0",
    vestedAmount: "0",
    releasableAmount: "0",
    revoked: false
  });
  
  // Minting state (for contract owner/minters)
  const [mintTo, setMintTo] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [isMinter, setIsMinter] = useState(false);
  
  // Burning state
  const [burnAmount, setBurnAmount] = useState("");

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask not detected. Please install MetaMask!");
        return;
      }

      setLoading(true);
      const prov = new ethers.BrowserProvider(window.ethereum);
      await prov.send("eth_requestAccounts", []);
      const signer = await prov.getSigner();
      setProvider(prov);
      setSigner(signer);
      setAccount(await signer.getAddress());
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      setContract(contract);
      
      const decimals = await contract.decimals();
      setDecimals(decimals);
      
      setTxStatus("Wallet connected successfully! 🎉");
    } catch (error) {
      console.error("Wallet connection error:", error);
      setTxStatus("Error connecting wallet: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all data
  const fetchAllData = async () => {
    if (!contract || !account) return;
    
    try {
      setLoading(true);
      
      // Basic token info
      const [name, symbol, totalSupply, maxSupply, bal, owner, isMinterResult] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.totalSupply(),
        contract.MAX_SUPPLY(),
        contract.balanceOf(account),
        contract.owner(),
        contract.minters(account)
      ]);
      
      setTokenInfo({
        name,
        symbol,
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        maxSupply: ethers.formatUnits(maxSupply, decimals)
      });
      
      setBalance(ethers.formatUnits(bal, decimals));
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
      setIsMinter(isMinterResult);
      
      // Staking info
      const stakeInfoResult = await contract.getStakeInfo(account);
      setStakeInfo({
        stakedAmount: ethers.formatUnits(stakeInfoResult[0], decimals),
        stakingDuration: stakeInfoResult[1].toString(),
        pendingReward: ethers.formatUnits(stakeInfoResult[2], decimals)
      });
      
      // Vesting info
      const vestingInfoResult = await contract.getVestingInfo(account);
      setVestingInfo({
        totalAmount: ethers.formatUnits(vestingInfoResult[0], decimals),
        releasedAmount: ethers.formatUnits(vestingInfoResult[1], decimals),
        vestedAmount: ethers.formatUnits(vestingInfoResult[2], decimals),
        releasableAmount: ethers.formatUnits(vestingInfoResult[3], decimals),
        revoked: vestingInfoResult[4]
      });
      
    } catch (error) {
      console.error("Error fetching data:", error);
      setTxStatus("Error fetching data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && account) {
      fetchAllData();
      
      // Set up event listeners
      const transferFilter = contract.filters.Transfer();
      const stakeFilter = contract.filters.TokensStaked();
      const unstakeFilter = contract.filters.TokensUnstaked();
      
      contract.on(transferFilter, () => fetchAllData());
      contract.on(stakeFilter, () => fetchAllData());
      contract.on(unstakeFilter, () => fetchAllData());
      
      return () => {
        contract.removeAllListeners();
      };
    }
  }, [contract, account, decimals]);

  // Handle transfer
  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!to || !amount || !contract) return;
    
    try {
      setLoading(true);
      setTxStatus("Sending transaction...");
      const tx = await contract.transfer(to, ethers.parseUnits(amount, decimals));
      setTxStatus("Transaction submitted! Waiting for confirmation...");
      await tx.wait();
      setTxStatus("Transfer successful! ✅");
      setTo("");
      setAmount("");
      fetchAllData();
    } catch (error) {
      console.error("Transfer error:", error);
      setTxStatus("Transfer failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle minting (owner/minter only)
  const handleMint = async (e) => {
    e.preventDefault();
    if (!mintTo || !mintAmount || !contract) return;
    
    try {
      setLoading(true);
      setTxStatus("Minting tokens...");
      const tx = await contract.mint(mintTo, ethers.parseUnits(mintAmount, decimals));
      await tx.wait();
      setTxStatus("Tokens minted successfully! ✅");
      setMintTo("");
      setMintAmount("");
      fetchAllData();
    } catch (error) {
      console.error("Mint error:", error);
      setTxStatus("Mint failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle burning
  const handleBurn = async (e) => {
    e.preventDefault();
    if (!burnAmount || !contract) return;
    
    try {
      setLoading(true);
      setTxStatus("Burning tokens...");
      const tx = await contract.burn(ethers.parseUnits(burnAmount, decimals));
      await tx.wait();
      setTxStatus("Tokens burned successfully! ✅");
      setBurnAmount("");
      fetchAllData();
    } catch (error) {
      console.error("Burn error:", error);
      setTxStatus("Burn failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle staking
  const handleStake = async (e) => {
    e.preventDefault();
    if (!stakeAmount || !contract) return;
    
    try {
      setLoading(true);
      setTxStatus("Staking tokens...");
      const tx = await contract.stake(ethers.parseUnits(stakeAmount, decimals));
      await tx.wait();
      setTxStatus("Tokens staked successfully! ✅");
      setStakeAmount("");
      fetchAllData();
    } catch (error) {
      console.error("Stake error:", error);
      setTxStatus("Stake failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle unstaking
  const handleUnstake = async (e) => {
    e.preventDefault();
    if (!unstakeAmount || !contract) return;
    
    try {
      setLoading(true);
      setTxStatus("Unstaking tokens...");
      const tx = await contract.unstake(ethers.parseUnits(unstakeAmount, decimals));
      await tx.wait();
      setTxStatus("Tokens unstaked successfully! ✅");
      setUnstakeAmount("");
      fetchAllData();
    } catch (error) {
      console.error("Unstake error:", error);
      setTxStatus("Unstake failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle vesting release
  const handleReleaseVested = async () => {
    if (!contract) return;
    
    try {
      setLoading(true);
      setTxStatus("Releasing vested tokens...");
      const tx = await contract.releaseVestedTokens();
      await tx.wait();
      setTxStatus("Vested tokens released successfully! ✅");
      fetchAllData();
    } catch (error) {
      console.error("Release error:", error);
      setTxStatus("Release failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    return `${days}d ${hours}h`;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 Advanced MyToken DApp</h1>
        <p>Complete Tokenization System with Staking, Vesting & More</p>
      </header>

      {!account ? (
        <div className="connect-section">
          <button 
            onClick={connectWallet} 
            disabled={loading}
            className="connect-button"
          >
            {loading ? "Connecting..." : "Connect Wallet"}
          </button>
        </div>
      ) : (
        <div className="main-content">
          {/* Account Info */}
          <div className="section">
            <h2>👤 Account Information</h2>
            <div className="info-grid">
              <div><strong>Address:</strong> {account}</div>
              <div><strong>Balance:</strong> {balance} {tokenInfo.symbol}</div>
              <div><strong>Role:</strong> {isOwner ? "Owner" : isMinter ? "Minter" : "User"}</div>
            </div>
          </div>

          {/* Token Information */}
          <div className="section">
            <h2>🪙 Token Information</h2>
            <div className="info-grid">
              <div><strong>Name:</strong> {tokenInfo.name}</div>
              <div><strong>Symbol:</strong> {tokenInfo.symbol}</div>
              <div><strong>Total Supply:</strong> {tokenInfo.totalSupply}</div>
              <div><strong>Max Supply:</strong> {tokenInfo.maxSupply}</div>
            </div>
          </div>

          {/* Transfer Section */}
          <div className="section">
            <h2>💸 Transfer Tokens</h2>
            <form onSubmit={handleTransfer} className="form">
              <input
                type="text"
                placeholder="Recipient address"
                value={to}
                onChange={e => setTo(e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="0"
                step="any"
                required
              />
              <button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send"}
              </button>
            </form>
          </div>

          {/* Staking Section */}
          <div className="section">
            <h2>🏦 Staking</h2>
            <div className="info-grid">
              <div><strong>Staked Amount:</strong> {stakeInfo.stakedAmount} {tokenInfo.symbol}</div>
              <div><strong>Staking Duration:</strong> {formatDuration(stakeInfo.stakingDuration)}</div>
              <div><strong>Pending Reward:</strong> {stakeInfo.pendingReward} {tokenInfo.symbol}</div>
            </div>
            
            <div className="form-row">
              <form onSubmit={handleStake} className="form">
                <input
                  type="number"
                  placeholder="Amount to stake"
                  value={stakeAmount}
                  onChange={e => setStakeAmount(e.target.value)}
                  min="0"
                  step="any"
                />
                <button type="submit" disabled={loading}>Stake</button>
              </form>
              
              <form onSubmit={handleUnstake} className="form">
                <input
                  type="number"
                  placeholder="Amount to unstake"
                  value={unstakeAmount}
                  onChange={e => setUnstakeAmount(e.target.value)}
                  min="0"
                  step="any"
                />
                <button type="submit" disabled={loading}>Unstake</button>
              </form>
            </div>
          </div>

          {/* Vesting Section */}
          {parseFloat(vestingInfo.totalAmount) > 0 && (
            <div className="section">
              <h2>⏰ Vesting</h2>
              <div className="info-grid">
                <div><strong>Total Amount:</strong> {vestingInfo.totalAmount} {tokenInfo.symbol}</div>
                <div><strong>Released:</strong> {vestingInfo.releasedAmount} {tokenInfo.symbol}</div>
                <div><strong>Vested:</strong> {vestingInfo.vestedAmount} {tokenInfo.symbol}</div>
                <div><strong>Releasable:</strong> {vestingInfo.releasableAmount} {tokenInfo.symbol}</div>
              </div>
              
              {parseFloat(vestingInfo.releasableAmount) > 0 && (
                <button 
                  onClick={handleReleaseVested} 
                  disabled={loading}
                  className="action-button"
                >
                  Release Vested Tokens
                </button>
              )}
            </div>
          )}

          {/* Burn Section */}
          <div className="section">
            <h2>🔥 Burn Tokens</h2>
            <form onSubmit={handleBurn} className="form">
              <input
                type="number"
                placeholder="Amount to burn"
                value={burnAmount}
                onChange={e => setBurnAmount(e.target.value)}
                min="0"
                step="any"
              />
              <button type="submit" disabled={loading} className="danger-button">
                Burn Tokens
              </button>
            </form>
          </div>

          {/* Minting Section (Owner/Minter only) */}
          {(isOwner || isMinter) && (
            <div className="section">
              <h2>🏭 Mint Tokens</h2>
              <form onSubmit={handleMint} className="form">
                <input
                  type="text"
                  placeholder="Recipient address"
                  value={mintTo}
                  onChange={e => setMintTo(e.target.value)}
                  required
                />
                <input
                  type="number"
                  placeholder="Amount to mint"
                  value={mintAmount}
                  onChange={e => setMintAmount(e.target.value)}
                  min="0"
                  step="any"
                  required
                />
                <button type="submit" disabled={loading} className="mint-button">
                  Mint Tokens
                </button>
              </form>
            </div>
          )}

          {/* Status Section */}
          {txStatus && (
            <div className={`status ${txStatus.includes('Error') || txStatus.includes('failed') ? 'error' : 'success'}`}>
              {txStatus}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;

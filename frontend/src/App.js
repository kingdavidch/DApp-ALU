import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";

// Replace with your deployed contract address after deployment
const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";

// Minimal ABI for ERC-20
const ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

function App() {
  const [provider, setProvider] = useState();
  const [signer, setSigner] = useState();
  const [account, setAccount] = useState();
  const [network, setNetwork] = useState();
  const [contract, setContract] = useState();
  const [balance, setBalance] = useState();
  const [decimals, setDecimals] = useState(18);
  const [symbol, setSymbol] = useState("TOKEN");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [txStatus, setTxStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Connect wallet
  const connectWallet = async () => {
    setError("");
    setLoading(true);
    try {
      if (window.ethereum) {
        const prov = new ethers.BrowserProvider(window.ethereum);
        await prov.send("eth_requestAccounts", []);
        const signer = await prov.getSigner();
        setProvider(prov);
        setSigner(signer);
        const address = await signer.getAddress();
        setAccount(address);
        const network = await prov.getNetwork();
        setNetwork(network);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
        setContract(contract);
        const decimals = await contract.decimals();
        setDecimals(decimals);
        try {
          const symbol = await contract.symbol();
          setSymbol(symbol);
        } catch {
          setSymbol("TOKEN");
        }
      } else {
        setError("MetaMask not detected. Please install MetaMask.");
      }
    } catch (err) {
      setError("Failed to connect wallet: " + err.message);
    }
    setLoading(false);
  };

  // Fetch balance
  const fetchBalance = async () => {
    if (contract && account) {
      setLoading(true);
      try {
        const bal = await contract.balanceOf(account);
        setBalance(ethers.formatUnits(bal, decimals));
      } catch (err) {
        setError("Failed to fetch balance: " + err.message);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract && account) {
      fetchBalance();
    }
    // eslint-disable-next-line
  }, [contract, account, decimals]);

  // Validate Ethereum address
  const isValidAddress = (address) => {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  };

  // Handle transfer
  const handleTransfer = async (e) => {
    e.preventDefault();
    setError("");
    setTxStatus("");
    setTxHash("");
    if (!isValidAddress(to)) {
      setError("Invalid recipient address.");
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setLoading(true);
    setTxStatus("Sending...");
    try {
      const tx = await contract.transfer(to, ethers.parseUnits(amount, decimals));
      setTxStatus("Transaction sent. Waiting for confirmation...");
      setTxHash(tx.hash);
      await tx.wait();
      setTxStatus("Success! Tokens transferred.");
      fetchBalance();
    } catch (err) {
      setError("Error: " + (err.info?.error?.message || err.message));
      setTxStatus("");
    }
    setLoading(false);
  };

  return (
    <div className="App">
      <header className="header">
        <h1>{symbol} Token DApp</h1>
      </header>
      <div className="card">
        {!account ? (
          <button className="connect-btn" onClick={connectWallet} disabled={loading}>
            {loading ? "Connecting..." : "Connect Wallet"}
          </button>
        ) : (
          <>
            <div className="wallet-info">
              <p><b>Account:</b> {account.slice(0, 6)}...{account.slice(-4)}</p>
              <p><b>Network:</b> {network?.name} ({network?.chainId})</p>
              <p><b>Balance:</b> {loading ? "Loading..." : `${balance} ${symbol}`}</p>
            </div>
            <form className="transfer-form" onSubmit={handleTransfer}>
              <input
                type="text"
                placeholder="Recipient address"
                value={to}
                onChange={e => setTo(e.target.value)}
                required
                disabled={loading}
              />
              <input
                type="number"
                placeholder={`Amount (${symbol})`}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="0"
                step="any"
                required
                disabled={loading}
              />
              <button type="submit" disabled={loading}>
                {loading ? "Processing..." : `Send ${symbol}`}
              </button>
            </form>
            {txStatus && <p className="tx-status">{txStatus}</p>}
            {txHash && (
              <p className="tx-link">
                <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                  View on Etherscan
                </a>
              </p>
            )}
          </>
        )}
        {error && <p className="error">{error}</p>}
      </div>
      <footer className="footer">
        <p>Powered by Ethereum &amp; React</p>
      </footer>
    </div>
  );
}

export default App;

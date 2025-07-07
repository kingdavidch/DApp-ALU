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
];

function App() {
  const [provider, setProvider] = useState();
  const [signer, setSigner] = useState();
  const [account, setAccount] = useState();
  const [contract, setContract] = useState();
  const [balance, setBalance] = useState();
  const [decimals, setDecimals] = useState(18);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [txStatus, setTxStatus] = useState("");

  // Connect wallet
  const connectWallet = async () => {
    if (window.ethereum) {
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
    } else {
      alert("MetaMask not detected");
    }
  };

  // Fetch balance
  const fetchBalance = async () => {
    if (contract && account) {
      const bal = await contract.balanceOf(account);
      setBalance(ethers.formatUnits(bal, decimals));
    }
  };

  useEffect(() => {
    if (contract && account) {
      fetchBalance();
    }
    // eslint-disable-next-line
  }, [contract, account, decimals]);

  // Handle transfer
  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!to || !amount) return;
    setTxStatus("Sending...");
    try {
      const tx = await contract.transfer(to, ethers.parseUnits(amount, decimals));
      await tx.wait();
      setTxStatus("Success!");
      fetchBalance();
    } catch (err) {
      setTxStatus("Error: " + err.message);
    }
  };

  return (
    <div className="App">
      <h1>MyToken DApp</h1>
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p><b>Account:</b> {account}</p>
          <p><b>Balance:</b> {balance} MTK</p>
          <form onSubmit={handleTransfer}>
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
            <button type="submit">Send</button>
          </form>
          {txStatus && <p>{txStatus}</p>}
        </div>
      )}
    </div>
  );
}

export default App;

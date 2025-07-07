# DApp-alu: ERC-20 Token Transfer DApp

## Backend (Smart Contract)

### Prerequisites
- Node.js & npm
- [MetaMask](https://metamask.io/) wallet
- Sepolia testnet ETH (get from a faucet)

### Setup
1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the root with:
   ```env
   SEPOLIA_RPC_URL=YOUR_SEPOLIA_RPC_URL
   PRIVATE_KEY=YOUR_WALLET_PRIVATE_KEY
   ```

### Compile Contracts
```bash
npx hardhat compile
```

### Run Tests
```bash
npx hardhat test
```

### Deploy to Sepolia
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

- The contract address will be printed after deployment.
- Use this address in the frontend for interaction.

---

## Next Steps
- Frontend (React) will be scaffolded in the `frontend/` directory.
- More instructions will be added for frontend usage and full DApp workflow.

---

## Frontend (React DApp)

### Setup
1. Go to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
2. In `src/App.js`, set `CONTRACT_ADDRESS` to your deployed contract address.

### Run the DApp
```bash
npm start
```
- Open [http://localhost:3000](http://localhost:3000) in your browser.
- Connect MetaMask (ensure it's on Sepolia testnet and has your token).
- View your balance and transfer tokens.

---

## Submission Checklist
- [x] Smart contract (ERC-20) with transfer and balanceOf
- [x] Hardhat tests
- [x] Deployment script
- [x] React frontend: connect wallet, show balance, transfer tokens
- [x] Documentation
- [ ] Add contract address to frontend and redeploy
- [ ] Screenshots and demo video

---

## How it Works
- The smart contract is a standard ERC-20 token.
- The frontend lets users connect their wallet, view their token balance, and transfer tokens to any address.
- All interactions are on the Sepolia Ethereum testnet.

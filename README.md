# 🚀 DApp-ALU: ERC-20 Token Transfer DApp

A full-stack decentralized application (DApp) built with Solidity smart contracts and React frontend. This project demonstrates how to create, deploy, and interact with ERC-20 tokens on the Ethereum blockchain.

## 🌟 Features

- **ERC-20 Token Contract**: Standard compliant token with transfer functionality
- **React Frontend**: Modern web interface for wallet interaction
- **MetaMask Integration**: Seamless wallet connection and transaction signing
- **Testnet Ready**: Configured for Sepolia testnet deployment
- **Comprehensive Testing**: Full test coverage for smart contracts and frontend
- **Gas Optimized**: Efficient contract deployment and execution

## 🛠️ Tech Stack

**Backend:**
- Solidity ^0.8.20
- Hardhat development framework
- OpenZeppelin contracts
- Ethers.js for blockchain interaction

**Frontend:**
- React 19.1.0
- Ethers.js v6
- Modern CSS styling
- Jest testing framework

## 📋 Prerequisites

Before you begin, ensure you have:

- [Node.js](https://nodejs.org/) (v16 or higher) & npm
- [MetaMask](https://metamask.io/) browser extension
- Sepolia testnet ETH ([get from faucet](https://sepoliafaucet.com/))
- Code editor (VS Code recommended)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/kingdavidch/DApp-ALU.git
cd DApp-ALU
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_wallet_private_key_here
```

> ⚠️ **Security Note**: Never commit your private key to version control. Use a test wallet only.

### 3. Smart Contract Development

#### Compile Contracts
```bash
npx hardhat compile
```

#### Run Tests
```bash
npx hardhat test
```

Expected output: ✅ 12 passing tests

#### Deploy to Sepolia
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Save the deployed contract address for frontend configuration.

### 4. Frontend Setup

```bash
cd frontend
npm install
```

#### Configure Contract Address
Edit `frontend/src/App.js` and replace:
```javascript
const CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE";
```

#### Run Frontend Tests
```bash
npm test -- --watchAll=false
```

#### Start Development Server
```bash
npm start
```

Visit [http://localhost:3000](http://localhost:3000) to interact with your DApp!

## 📱 How to Use the DApp

1. **Connect Wallet**: Click "Connect Wallet" and approve MetaMask connection
2. **Switch Network**: Ensure MetaMask is on Sepolia testnet
3. **View Balance**: Your MTK token balance will display automatically
4. **Transfer Tokens**: 
   - Enter recipient address
   - Specify amount to transfer
   - Click "Send" and confirm transaction in MetaMask

## 🧪 Testing

### Smart Contract Tests
```bash
npx hardhat test
```

Tests cover:
- Token deployment and initial supply
- Transfer functionality
- Balance updates
- Access controls

### Frontend Tests
```bash
cd frontend && npm test -- --watchAll=false
```

Tests verify:
- Component rendering
- UI element presence
- User interaction flows

## 📁 Project Structure

```
DApp-ALU/
├── contracts/
│   ├── MyToken.sol          # ERC-20 token contract
│   └── Lock.sol             # Time-locked contract
├── frontend/
│   ├── src/
│   │   ├── App.js           # Main React component
│   │   ├── App.test.js      # Frontend tests
│   │   └── ...
│   └── package.json
├── scripts/
│   └── deploy.js            # Deployment script
├── test/
│   ├── MyToken.js           # Token contract tests
│   └── Lock.js              # Lock contract tests
├── hardhat.config.js        # Hardhat configuration
└── package.json
```

## 🔧 Configuration

### Network Configuration
The project is configured for Sepolia testnet. To add other networks, modify `hardhat.config.js`:

```javascript
networks: {
  sepolia: {
    url: SEPOLIA_RPC_URL,
    accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
  },
  // Add other networks here
}
```

### Token Configuration
Customize your token in `contracts/MyToken.sol`:
- Token name: "MyToken"
- Symbol: "MTK"
- Initial supply: Set during deployment

## 🚨 Troubleshooting

**Common Issues:**

1. **MetaMask Connection Failed**
   - Ensure MetaMask is installed and unlocked
   - Check if you're on the correct network (Sepolia)

2. **Transaction Failed**
   - Verify you have sufficient ETH for gas fees
   - Check if contract address is correctly configured

3. **Tests Failing**
   - Run `npm install` to ensure all dependencies are installed
   - Check Node.js version compatibility

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract libraries
- [Hardhat](https://hardhat.org/) for the excellent development framework
- [React](https://reactjs.org/) for the frontend framework
- [Ethers.js](https://docs.ethers.io/) for blockchain interaction

## 📞 Support

If you have questions or need help:
- Open an issue on GitHub
- Check the [Hardhat documentation](https://hardhat.org/docs)
- Visit [Ethereum development resources](https://ethereum.org/developers)

---

**Happy Building! 🎉**

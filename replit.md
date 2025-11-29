# WaveHack Massa Social dApp - Replit Setup

## Overview
This is a decentralized social network (dApp) built on the Massa blockchain. It features wallet-native identity, on-chain profiles and posts, IPFS storage for media, follow graphs, reactions, threaded conversations, search, and direct messaging.

**Architecture:**
- **Frontend**: Next.js 14 (App Router, TypeScript, Tailwind CSS)
- **Smart Contracts**: AssemblyScript contracts (pre-compiled in `contracts/build/`)
- **Storage**: IPFS via nft.storage for media
- **Blockchain**: Massa buildnet/testnet

## Current State
The project has been configured to run in the Replit environment:
- ✅ Dependencies installed
- ✅ Next.js dev server configured on port 5000 (0.0.0.0)
- ✅ Environment variables template created
- ✅ Static deployment configured for production
- ✅ Workflow set up for development

## Project Structure
```
.
├── contracts/          # AssemblyScript smart contracts
│   ├── assembly/       # Contract source code
│   └── build/          # Compiled WASM artifacts
├── web/                # Next.js frontend application
│   ├── src/
│   │   ├── app/        # Next.js app router pages
│   │   ├── components/ # React components
│   │   ├── lib/        # Utilities and Massa client
│   │   └── providers/  # React context providers
│   └── .env.local      # Environment variables (not committed)
└── package.json        # Monorepo root
```

## Required Setup Steps

### 1. Deploy the Smart Contract
Before the app can function, you need to deploy the smart contract:

1. Get test MAS tokens from the Massa faucet
2. Use MassaStation wallet or Massa CLI to deploy `contracts/build/social.wasm`
3. Copy the deployed contract address

For detailed deployment instructions, see `DEPLOYMENT.md`.

### 2. Configure Environment Variables
Edit `web/.env.local` and add:

```env
# REQUIRED: Add your deployed contract address here
NEXT_PUBLIC_MASSA_CONTRACT_ADDRESS=AS12...your_address_here

# REQUIRED: Get a free API token from https://nft.storage/
NEXT_PUBLIC_NFT_STORAGE_TOKEN=your_token_here
```

The other variables have defaults and don't need to be changed for buildnet.

### 3. Connect Your Wallet
To use the app, you'll need:
- MassaStation, Bearby, or Metamask Snap wallet
- Some test MAS tokens on buildnet

## Development

### Running the App
The dev server is already configured and runs automatically on port 5000.
- View the app in the Webview panel
- Changes auto-reload

### Available Commands
- `npm run dev` - Start Next.js dev server
- `npm run build` - Production build
- `npm run build:deweb` - Build for DeWeb (static export)
- `npm run lint` - Run ESLint
- `npm run build -w contracts` - Rebuild smart contracts

## Deployment

### To Replit (Development)
The app is already deployed in development mode. Just make sure:
1. Contract is deployed and address is in `.env.local`
2. NFT.Storage token is configured
3. Workflow is running

### To Massa DeWeb (Production)
For decentralized hosting on Massa:

1. Set environment variables in `web/.env.local`
2. Build: `npm run build:deweb`
3. Deploy: `npm run deploy:deweb`

See `DEPLOYMENT.md` for complete DeWeb deployment instructions.

### To Replit Deployments (Static)
The deployment is configured for static hosting:
- Build command: `npm run build:deweb`
- Public directory: `web/out`
- Make sure environment variables are set before building!

## Features
- 🔐 Wallet login (MassaStation, Bearby, Metamask Snap)
- 👤 On-chain profiles with IPFS avatars/banners
- 📝 Create posts with media, hashtags, replies, reactions
- 👥 Follow/unfollow with decentralized feed
- 🔥 Trending topics
- 💬 Direct messaging between wallet addresses
- 🔍 Search users by handle/address

## Troubleshooting

### "Contract not deployed" error
- Deploy the smart contract first
- Add the contract address to `NEXT_PUBLIC_MASSA_CONTRACT_ADDRESS`

### "NFT Storage token not configured"
- Get a free token from https://nft.storage/
- Add it to `NEXT_PUBLIC_NFT_STORAGE_TOKEN` in `web/.env.local`

### Wallet connection fails
- Make sure you're using a Massa-compatible wallet
- Ensure you have test MAS tokens
- Check that you're on the correct network (buildnet)

## Important Notes
- This app uses on-chain storage, so every action costs gas
- Media files are stored on IPFS, not on-chain
- The app is configured for Massa buildnet by default
- API routes (like `/api/storage`) only work in dev mode, not in DeWeb deployment
- In production (DeWeb), the app uses client-side IPFS uploads directly

## Resources
- [Massa Documentation](https://docs.massa.net/)
- [NFT.Storage](https://nft.storage/)
- [MassaStation Wallet](https://station.massa.net/)

## Last Updated
November 29, 2025 - Initial Replit setup

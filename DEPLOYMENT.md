# Complete Deployment Guide

This guide will help you deploy the Massa Social dApp to Massa's DeWeb (decentralized web hosting).

## Prerequisites

1. **Node.js 18+** and **npm 9+**
2. **Massa Wallet** (MassaStation or Bearby) with sufficient MAS tokens for deployment
3. **NFT.Storage API Token** - Get one from [nft.storage](https://nft.storage/)
4. **DeWeb CLI** - Install globally:
   ```bash
   npm install -g @massalabs/deweb-cli
   ```

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Build the Smart Contract

```bash
npm run build -w contracts
```

This will create `contracts/build/social.wasm` which you'll deploy to the Massa blockchain.

## Step 3: Deploy the Smart Contract

### Option A: Using MassaStation Wallet (Recommended)

1. Open MassaStation wallet
2. Make sure you have MAS tokens (get from faucet if needed)
3. Go to **Smart Contracts** section
4. Click **Deploy Contract**
5. Select `contracts/build/social.wasm`
6. Set parameters:
   - **Max Gas**: 5000000
   - **Fee**: 0.01 MAS
   - **Coins**: 0
7. Confirm and wait for deployment
8. **Copy the contract address** - you'll need this!

### Option B: Using Massa CLI

```bash
massa-client wallet_deploy_contract \
  <path_to_wallet.yaml> \
  <wallet_password> \
  contracts/build/social.wasm \
  5000000 \
  0.01 \
  0
```

### Option C: Using Deployment Scripts

- **Linux/Mac**: Run `./deploy-contract.sh`
- **Windows**: Run `.\deploy-contract.ps1`

These scripts will guide you through the deployment process.

## Step 4: Configure Environment Variables

Create a `.env.local` file in the `web/` directory:

```env
# REQUIRED: Your deployed contract address
NEXT_PUBLIC_MASSA_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE

# Massa Network Configuration (defaults shown)
NEXT_PUBLIC_MASSA_PUBLIC_API_URL=https://buildnet.massa.net/api/v2
NEXT_PUBLIC_MASSA_CHAIN_ID=776583

# IPFS Configuration
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/

# REQUIRED: NFT.Storage API Token for IPFS uploads
# Get your token from https://nft.storage/
# IMPORTANT: Must be prefixed with NEXT_PUBLIC_ for DeWeb deployment
NEXT_PUBLIC_NFT_STORAGE_TOKEN=YOUR_NFT_STORAGE_TOKEN_HERE
```

**Important Notes:**
- All environment variables used in the browser **must** be prefixed with `NEXT_PUBLIC_`
- This is because DeWeb only supports static sites (no server-side code)
- Never commit `.env.local` to git (it's already in `.gitignore`)

## Step 5: Test Locally (Optional but Recommended)

Before deploying to DeWeb, test the app locally:

```bash
npm run dev -w web
```

Visit `http://localhost:3000` and:
1. Connect your Massa wallet
2. Create a profile
3. Test creating a post
4. Verify everything works

## Step 6: Build for DeWeb

Build the Next.js app as a static export:

```bash
npm run build:deweb
```

This will:
1. Build the contract (if not already built)
2. Build the Next.js app as a static site
3. Create a `web/out/` directory with all static files

**Note:** The build process will fail if:
- `NEXT_PUBLIC_MASSA_CONTRACT_ADDRESS` is not set
- `NEXT_PUBLIC_NFT_STORAGE_TOKEN` is not set

## Step 7: Configure DeWeb CLI

Edit the `deweb_cli_config.json` file in the project root:

```json
{
  "wallet_password": "your-wallet-password",
  "wallet_path": "path/to/your/wallet.yaml",
  "node_url": "https://buildnet.massa.net/api/v2",
  "chunk_size": 64000,
  "metadatas": {
    "TITLE": "WaveHack Social on Massa",
    "DESCRIPTION": "A decentralized social layer for the Massa blockchain",
    "KEYWORD1": "massa",
    "KEYWORD2": "social",
    "KEYWORD3": "decentralized",
    "KEYWORD4": "web3"
  }
}
```

**Security Note:** 
- Never commit `deweb_cli_config.json` with your wallet password
- Consider using environment variables or keeping it in `.gitignore`
- You can also pass these values via command line flags

## Step 8: Deploy to DeWeb

From the project root, run:

```bash
npm run deploy:deweb
```

Or manually:

```bash
npx @massalabs/deweb-cli upload web/out
```

The CLI will:
1. Upload your static site to the Massa blockchain
2. Display the deployment address where your site is hosted
3. Provide instructions for accessing your site

## Step 9: Access Your Deployed Site

After deployment, you'll receive a Massa address. You can access your site via:

- **Direct address**: `https://massa-deweb.xyz/[YOUR_ADDRESS]`
- **Or configure a Massa Name System (MNS) domain** for easier access

## Troubleshooting

### Build Errors

- **"Cannot find module"**: Run `npm install` in the root directory
- **Environment variable errors**: Ensure all `NEXT_PUBLIC_*` variables are set in `web/.env.local`
- **Contract address missing**: Make sure you've deployed the contract and set `NEXT_PUBLIC_MASSA_CONTRACT_ADDRESS`

### Deployment Errors

- **Insufficient funds**: Ensure your wallet has enough MAS tokens
- **Upload timeout**: Try increasing `chunk_size` in `deweb_cli_config.json` or check your network connection
- **Wallet errors**: Verify your wallet path and password are correct in `deweb_cli_config.json`

### Runtime Errors

- **IPFS upload fails**: Check that `NEXT_PUBLIC_NFT_STORAGE_TOKEN` is set correctly
- **Contract calls fail**: 
  - Verify `NEXT_PUBLIC_MASSA_CONTRACT_ADDRESS` matches your deployed contract
  - Check that the contract is deployed and active on the network
  - Verify you're using the correct network (buildnet vs mainnet)

### Common Issues

1. **"Missing NEXT_PUBLIC_MASSA_CONTRACT_ADDRESS"**: 
   - Make sure you've deployed the contract and set the address in `web/.env.local`

2. **"NEXT_PUBLIC_NFT_STORAGE_TOKEN is not configured"**:
   - Get a token from https://nft.storage/
   - Add it to `web/.env.local` with the `NEXT_PUBLIC_` prefix

3. **API routes don't work after DeWeb deployment**:
   - This is expected! DeWeb only supports static sites
   - All functionality must use client-side code (which this app does)

## Production Checklist

- [ ] Smart contract deployed and address configured
- [ ] All environment variables set in `web/.env.local`
- [ ] Frontend builds successfully (`npm run build:deweb`)
- [ ] DeWeb CLI configured with wallet credentials
- [ ] Site deployed and accessible via DeWeb address
- [ ] Test wallet connection and basic functionality
- [ ] Test IPFS uploads (profile images, post media)
- [ ] Test contract interactions (posts, reactions, follows)
- [ ] Test messaging functionality

## Additional Resources

- [Massa DeWeb Documentation](https://docs.massa.net/docs/deweb/cli/upload)
- [Massa Smart Contract Docs](https://docs.massa.net/docs/build/smart-contract)
- [NFT.Storage Documentation](https://nft.storage/docs/)
- [MassaStation Wallet](https://station.massa.net/)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are met
3. Check the Massa documentation
4. Review the error messages carefully


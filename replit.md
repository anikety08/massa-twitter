# WaveHack Massa Social dApp

## Overview
A decentralized Twitter-like social network built on the Massa blockchain. Features wallet-native identity, on-chain profiles and posts, IPFS storage for media, follow graphs, reactions, threaded conversations, search, and direct messaging.

## Current State
The project has been set up with a modern Twitter/X-style UI:
- Modern three-column layout (sidebar, feed, right panel)
- Twitter-like post composer with character counter
- Post cards with like, comment, retweet, share actions
- Trending topics panel
- User search functionality
- Direct messaging system
- Profile management with avatar/banner uploads

## Architecture

| Layer | Stack | Responsibilities |
| --- | --- | --- |
| Smart Contracts | AssemblyScript + `@massalabs/massa-as-sdk` | Profiles, posts, reactions, replies, follow graph, trending topics, DMs |
| Frontend | Next.js 14 (App Router, TypeScript, Tailwind) | Wallet connection, IPFS uploads, feed UI, profile editor, messaging |
| Storage | IPFS via `nft.storage` | Profile avatars/banners, post attachments |
| Wallet & RPC | `@massalabs/wallet-provider`, `@massalabs/massa-web3` | Sign operations from MassaStation/Bearby |

## Project Structure
```
.
├── contracts/              # AssemblyScript smart contracts
│   ├── assembly/           # Contract source code
│   └── build/              # Compiled WASM artifacts
├── web/                    # Next.js frontend
│   ├── src/
│   │   ├── app/            # Next.js app router pages
│   │   ├── components/     # React components
│   │   │   ├── feed/       # Post card, composer, list
│   │   │   ├── home/       # Home shell, welcome section
│   │   │   ├── layout/     # Sidebar, right sidebar
│   │   │   ├── messages/   # Message panel
│   │   │   ├── profile/    # Profile form, setup overlay
│   │   │   ├── search/     # User search
│   │   │   ├── trending/   # Trending topics
│   │   │   ├── ui/         # Base UI components
│   │   │   └── wallet/     # Connect button
│   │   ├── lib/            # Utilities and Massa client
│   │   ├── providers/      # React context providers
│   │   └── state/          # Zustand stores
│   └── .env.local          # Environment variables
└── package.json            # Monorepo root
```

## Configuration

### Environment Variables (web/.env.local)
```env
# Contract address (already configured)
NEXT_PUBLIC_MASSA_CONTRACT_ADDRESS=AS12ToYPEhVd6jzpRZHzAj9eCyPvAL589HbWQUKzCNNVZrjGpp86Y

# Network configuration
NEXT_PUBLIC_MASSA_PUBLIC_API_URL=https://buildnet.massa.net/api/v2
NEXT_PUBLIC_MASSA_CHAIN_ID=776583

# IPFS
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
NEXT_PUBLIC_NFT_STORAGE_TOKEN=<configured>
```

## Development

### Running the App
The dev server runs on port 5000:
```bash
npm run dev
```

### Available Commands
| Command | Description |
| --- | --- |
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run build:deweb` | Build for DeWeb (static export) |
| `npm run lint` | Run ESLint |

## Features

### Implemented
- Wallet login (MassaStation, Bearby, Metamask Snap)
- On-chain profiles with IPFS avatars/banners
- Create posts with media, hashtags, 280 char limit
- Like/react to posts
- Reply functionality
- Follow/unfollow users
- Direct messaging between wallet addresses
- User search by handle/address
- Trending topics

### UI Components
- **Sidebar**: Navigation with Home, Explore, Notifications, Messages, Bookmarks, Profile
- **Feed**: Twitter-style post cards with engagement actions
- **Post Composer**: Tweet box with character counter and media upload
- **Right Panel**: Search, trending topics, who to follow suggestions
- **Profile**: Edit profile with avatar/banner upload, bio, handle

## Deployment

### Development (Replit)
Already configured with:
- Workflow: `npm run dev` on port 5000
- Static deployment configured for production

### Production (DeWeb)
```bash
npm run build:deweb
npm run deploy:deweb
```

## User Preferences
- Modern dark theme with Twitter/X-inspired design
- Blue accent colors (#1d9bf0)
- Fully functional blockchain integration

## Recent Changes
- November 29, 2025: Initial Replit setup
- November 29, 2025: Complete UI redesign to Twitter/X style
- November 29, 2025: Added modern three-column layout
- November 29, 2025: Improved all components with new styling

## Troubleshooting

### Wallet Connection Issues
- Ensure MassaStation or Bearby is installed
- Check that you're on Massa buildnet
- Get test MAS from the faucet

### Posts Not Showing
- Wallet must be connected
- Profile must be created first
- Check contract address is correct

## Resources
- [Massa Documentation](https://docs.massa.net/)
- [NFT.Storage](https://nft.storage/)
- [MassaStation Wallet](https://station.massa.net/)

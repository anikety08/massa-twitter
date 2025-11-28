# WaveHack Massa Social dApp

WaveHack is a Twitter-inspired social network that runs entirely on the Massa blockchain.  
It combines wallet-native identity, on-chain profiles and posts, decentralized storage for media, a follow graph, reactions, threaded conversations, search, and direct messages powered by Massa smart contracts.

## Architecture

| Layer | Stack | Responsibilities |
| --- | --- | --- |
| Smart contracts (`contracts/`) | AssemblyScript + `@massalabs/massa-as-sdk` | Profiles, posts, reactions, replies, follow graph, trending topics, direct-messages |
| Frontend (`web/`) | Next.js 14 (App Router, TypeScript, Tailwind) | Wallet connection, IPFS media uploads, feed UI, profile editor, messaging |
| Storage | IPFS via `nft.storage` (gateway configurable) | Profile avatars/banners, post attachments |
| Wallet & RPC | `@massalabs/wallet-provider`, `@massalabs/massa-web3` | Sign operations from MassaStation/Bearby/Metamask Snap, read RPC data |

## Features

- Wallet login (MassaStation, Bearby, Metamask Snap) with auto-reconnect.
- On-chain profile handle, display name, bio, avatar/banner (IPFS).
- Create text or media posts with hashtags/topics; replies and reactions are stored on chain.
- Follow/unfollow, decentralized feed filtered by the follow graph.
- Trending topic detection based on post metadata.
- Direct, encrypted-like messaging between wallet addresses (logged on chain for transparency).
- Search users by handle/address, profile previews.

## Prerequisites

- Node.js 18+
- npm 9+
- Access to the Massa buildnet/testnet RPC (defaults to buildnet public RPC)
- Massa wallet (MassaStation or compatible provider) with test MAS

## Setup

1. Install dependencies for the monorepo:

   ```bash
   npm install
   ```

2. Build the smart contract (WASM artifacts land in `contracts/build/`):

   ```bash
   npm run build -w contracts
   ```

3. Configure the frontend environment by creating `web/.env.local`:

   ```env
   NEXT_PUBLIC_MASSA_CONTRACT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
   NEXT_PUBLIC_MASSA_PUBLIC_API_URL=https://buildnet.massa.net/api/v2
   NEXT_PUBLIC_MASSA_CHAIN_ID=776583
   NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
   NFT_STORAGE_TOKEN=YOUR_NFT_STORAGE_API_TOKEN
   ```

   - `NEXT_PUBLIC_MASSA_CONTRACT_ADDRESS`: Address returned after deploying `build/social.wasm`.
   - `NFT_STORAGE_TOKEN`: API key from [nft.storage](https://nft.storage/).

4. Start the Next.js dev server:

   ```bash
   npm run dev -w web
   ```

   Visit `http://localhost:3000` and connect your Massa wallet.

## Smart Contract Deployment

1. Obtain MAS on buildnet/testnet via the official faucet.
2. Use Massa CLI or `massa-client` to deploy `contracts/build/social.wasm`, passing initial storage costs if necessary.
3. Note the contract address and update `NEXT_PUBLIC_MASSA_CONTRACT_ADDRESS`.
4. The frontend will automatically call contract entrypoints once the env is set.

### Contract Exposed Functions

- `upsert_profile`, `get_profile`, `get_profile_by_handle`
- `create_post`, `create_reply`, `get_post`, `list_recent_posts`, `list_posts_by_user`, `list_replies`
- `follow`, `unfollow`, `get_follow_stats`, `list_feed`
- `react_to_post`, `list_trending_topics`, `search_profiles`
- `send_message`, `list_messages`

All serialization uses the Massa `Args` protocol, so the frontend deserializes via `@massalabs/massa-web3`.

## Testing & Linting

- Run ESLint for the frontend:

  ```bash
  npm run lint -w web
  ```

- Contract compilation ensures AssemblyScript type safety; add integration tests via `as-pect` if needed.

## Production Notes

- Wallet actions prompt MassaStation/Bearby users; ensure dApp served over HTTPS in production.
- Update `NEXT_PUBLIC_MASSA_PUBLIC_API_URL` to a reliable RPC endpoint (self-hosted node recommended).
- Rotate `NFT_STORAGE_TOKEN` regularly; the API route keeps the token server-side.
- Consider pinning WASM hash and hardening contract access controls for mainnet.

## Folder Structure

```
.
├── contracts/        # AssemblyScript smart contracts
├── web/              # Next.js frontend
├── package.json      # Monorepo orchestrator
└── README.md
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run build -w contracts` | Compile AssemblyScript contracts to WASM |
| `npm run dev -w web` | Run Next.js dev server |
| `npm run build -w web` | Production build for the frontend |
| `npm run lint -w web` | Lint frontend |

## Future Improvements

- Add optimistic UI updates for reactions/posts.
- Integrate Massa DeWeb for fully decentralized frontend hosting.
- Implement encrypted off-chain message payloads stored on IPFS with on-chain references.
- Expand trending logic (time-windowed scores, hashtag discovery).

Enjoy shipping on Massa 🚀



#!/bin/bash

# Massa Smart Contract Deployment Script
# This script helps deploy the social contract to Massa buildnet

set -e

echo "🚀 Massa Social Contract Deployment"
echo "======================================"
echo ""

# Check if contract is built
if [ ! -f "contracts/build/social.wasm" ]; then
    echo "❌ Contract not found. Building contract..."
    npm run build -w contracts
fi

echo "✅ Contract built: contracts/build/social.wasm"
echo ""

# Check if massa-client is available
if ! command -v massa-client &> /dev/null; then
    echo "⚠️  massa-client not found in PATH"
    echo ""
    echo "Please install Massa CLI:"
    echo "  https://docs.massa.net/docs/node/install"
    echo ""
    echo "Or deploy manually using:"
    echo "  massa-client wallet_deploy_contract <wallet_path> <password> <contract_path> <max_gas> <fee> <coins>"
    echo ""
    exit 1
fi

echo "📋 Deployment Instructions:"
echo "============================"
echo ""
echo "1. Make sure you have MAS tokens in your wallet (get from faucet if needed)"
echo "2. Deploy the contract using one of these methods:"
echo ""
echo "   Method 1: Using massa-client CLI"
echo "   ---------------------------------"
echo "   massa-client wallet_deploy_contract \\"
echo "     <path_to_wallet.yaml> \\"
echo "     <wallet_password> \\"
echo "     contracts/build/social.wasm \\"
echo "     5000000 \\"
echo "     0.01 \\"
echo "     0"
echo ""
echo "   Method 2: Using MassaStation wallet"
echo "   ------------------------------------"
echo "   1. Open MassaStation wallet"
echo "   2. Go to Smart Contracts section"
echo "   3. Click 'Deploy Contract'"
echo "   4. Select contracts/build/social.wasm"
echo "   5. Set max gas: 5000000"
echo "   6. Set fee: 0.01 MAS"
echo "   7. Confirm deployment"
echo ""
echo "3. After deployment, copy the contract address"
echo "4. Update web/.env.local with:"
echo "   NEXT_PUBLIC_MASSA_CONTRACT_ADDRESS=<contract_address>"
echo ""
echo "📝 Contract file location: contracts/build/social.wasm"
echo ""


# Massa Smart Contract Deployment Script (PowerShell)
# This script helps deploy the social contract to Massa buildnet

Write-Host "🚀 Massa Social Contract Deployment" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if contract is built
if (-not (Test-Path "contracts\build\social.wasm")) {
    Write-Host "❌ Contract not found. Building contract..." -ForegroundColor Yellow
    npm run build -w contracts
}

Write-Host "✅ Contract built: contracts\build\social.wasm" -ForegroundColor Green
Write-Host ""

# Check if massa-client is available
$massaClient = Get-Command massa-client -ErrorAction SilentlyContinue
if (-not $massaClient) {
    Write-Host "⚠️  massa-client not found in PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please install Massa CLI:" -ForegroundColor Yellow
    Write-Host "  https://docs.massa.net/docs/node/install" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or deploy manually using:" -ForegroundColor Yellow
    Write-Host '  massa-client wallet_deploy_contract <wallet_path> <password> <contract_path> <max_gas> <fee> <coins>' -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "📋 Deployment Instructions:" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Make sure you have MAS tokens in your wallet (get from faucet if needed)" -ForegroundColor White
Write-Host "2. Deploy the contract using one of these methods:" -ForegroundColor White
Write-Host ""
Write-Host "   Method 1: Using massa-client CLI" -ForegroundColor Yellow
Write-Host "   ---------------------------------" -ForegroundColor Yellow
Write-Host '   massa-client wallet_deploy_contract \' -ForegroundColor Gray
Write-Host '     <path_to_wallet.yaml> \' -ForegroundColor Gray
Write-Host '     <wallet_password> \' -ForegroundColor Gray
Write-Host '     contracts\build\social.wasm \' -ForegroundColor Gray
Write-Host '     5000000 \' -ForegroundColor Gray
Write-Host '     0.01 \' -ForegroundColor Gray
Write-Host '     0' -ForegroundColor Gray
Write-Host ""
Write-Host "   Method 2: Using MassaStation wallet" -ForegroundColor Yellow
Write-Host "   ------------------------------------" -ForegroundColor Yellow
Write-Host "   1. Open MassaStation wallet" -ForegroundColor White
Write-Host "   2. Go to Smart Contracts section" -ForegroundColor White
Write-Host "   3. Click 'Deploy Contract'" -ForegroundColor White
Write-Host "   4. Select contracts\build\social.wasm" -ForegroundColor White
Write-Host "   5. Set max gas: 5000000" -ForegroundColor White
Write-Host "   6. Set fee: 0.01 MAS" -ForegroundColor White
Write-Host "   7. Confirm deployment" -ForegroundColor White
Write-Host ""
Write-Host "3. After deployment, copy the contract address" -ForegroundColor White
Write-Host "4. Update web\.env.local with:" -ForegroundColor White
Write-Host '   NEXT_PUBLIC_MASSA_CONTRACT_ADDRESS=<contract_address>' -ForegroundColor Gray
Write-Host ""
Write-Host "📝 Contract file location: contracts\build\social.wasm" -ForegroundColor Cyan
Write-Host ""


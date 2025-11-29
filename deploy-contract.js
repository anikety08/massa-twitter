#!/usr/bin/env node

/**
 * Massa Smart Contract Deployment Script
 * Deploys the social contract to Massa buildnet using massa-web3 SDK
 */

const { readFileSync } = require('fs');
const { join } = require('path');
const {
  Account,
  JsonRpcProvider,
  SmartContract,
  MAX_GAS_DEPLOYMENT,
  Mas,
} = require('@massalabs/massa-web3');

// Configuration
const PRIVATE_KEY = process.env.MASSA_PRIVATE_KEY || 'S1fEBcGuCgcjC7mnVN6SDPbj1kpiwdNpP5iQ6RdY3SyjPDKYjF2';
const PUBLIC_API_URL = process.env.MASSA_PUBLIC_API_URL || 'https://buildnet.massa.net/api/v2';
const CONTRACT_PATH = join(__dirname, 'contracts', 'build', 'social.wasm');
const MAX_GAS = MAX_GAS_DEPLOYMENT; // Use maximum allowed gas for deployment
const FEE = Mas.fromString('0.01'); // 0.01 MAS
const COINS = Mas.fromString('0');

async function deployContract() {
  console.log('🚀 Massa Social Contract Deployment');
  console.log('======================================\n');

  // Check if contract exists
  try {
    readFileSync(CONTRACT_PATH);
    console.log('✅ Contract found: contracts/build/social.wasm\n');
  } catch (error) {
    console.error('❌ Contract not found at:', CONTRACT_PATH);
    console.error('   Please build the contract first: npm run build -w contracts\n');
    process.exit(1);
  }

  try {
    // Create account from private key
    const account = await Account.fromPrivateKey(PRIVATE_KEY);
    console.log('📝 Deploying from address:', account.address.toString());
    console.log('🌐 Network:', PUBLIC_API_URL);
    console.log('');

    // Create provider with account
    const provider = JsonRpcProvider.fromRPCUrl(PUBLIC_API_URL, account);

    // Read contract bytes
    const contractBytes = readFileSync(CONTRACT_PATH);
    console.log('📦 Contract size:', contractBytes.length, 'bytes');
    console.log('⛽ Max Gas:', MAX_GAS ? MAX_GAS.toString() : 'Auto-estimate');
    console.log('💰 Fee:', FEE.toString(), 'nMAS (0.01 MAS)');
    console.log('');

    // Deploy contract using SmartContract.deploy
    console.log('📤 Deploying contract...');
    try {
      const deployOptions = {
        fee: FEE,
        coins: COINS,
        maxGas: MAX_GAS,
        waitFinalExecution: true,
      };
      
      const deployedContract = await SmartContract.deploy(
        provider,
        contractBytes,
        undefined, // No constructor args
        deployOptions
      );

      console.log('✅ Contract deployed successfully!');
      console.log('📍 Contract Address:', deployedContract.address);
      console.log('');
      console.log('📋 Next steps:');
      console.log('   1. Update web/.env.local with:');
      console.log(`      NEXT_PUBLIC_MASSA_CONTRACT_ADDRESS=${deployedContract.address}`);
      console.log('   2. Make sure NEXT_PUBLIC_NFT_STORAGE_TOKEN is set');
      console.log('   3. Run: npm run dev -w web');
      console.log('');
    } catch (deployError) {
      // If deployment fails but operation was sent, try to get the operation ID
      if (deployError.operationId) {
        console.log('⚠️  Deployment operation sent but failed to get address');
        console.log('📍 Operation ID:', deployError.operationId);
        console.log('   Check the operation in Massa Explorer:');
        console.log(`   https://buildnet.massa.net/explorer/operation/${deployError.operationId}`);
        console.log('');
        throw deployError;
      }
      throw deployError;
    }
  } catch (error) {
    // Try to extract operation ID from error message
    const opIdMatch = error.message?.match(/operation ([A-Za-z0-9]+)/i);
    if (opIdMatch) {
      const opId = opIdMatch[1];
      console.log('\n⚠️  Deployment may have succeeded despite the error');
      console.log('📍 Operation ID:', opId);
      console.log('   Check the operation in Massa Explorer:');
      console.log(`   https://buildnet.massa.net/explorer/operation/${opId}`);
      console.log('\n   The contract address should be visible in the operation details.');
      console.log('   Look for "Smart Contract Deploy" in the operation content.\n');
    } else {
      console.error('❌ Deployment error:', error.message);
      if (error.stack) {
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
}

// Run deployment
deployContract().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * Zora Integration Test Script
 * 
 * This script tests the Zora integration setup without requiring a frontend.
 * Run with: node scripts/test-zora-integration.js
 */

require('dotenv').config();
require('ts-node').register({ transpileOnly: true });
const { NeynarService } = require('../src/neynarClient');
const { ZoraService } = require('../src/zoraService');

async function testZoraIntegration() {
  console.log('🧪 Testing Zora Integration Setup...\n');

  // Test 1: Environment Variables
  console.log('1️⃣ Checking environment variables...');
  const requiredEnvVars = [
    'NEYNAR_API_KEY',
    'NEYNAR_CLIENT_ID', 
    'ZORA_API_KEY',
    'ZORA_SIGNER_PRIVATE_KEY'
  ];

  const missingVars = requiredEnvVars.filter(key => !process.env[key]);
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    console.log('💡 Copy .env.example to .env and fill in the values');
    process.exit(1);
  }
  console.log('✅ All required environment variables present\n');

  // Test 2: Neynar Service  
  console.log('2️⃣ Testing Neynar service...');
  try {
    const neynar = new NeynarService({ apiKey: process.env.NEYNAR_API_KEY });
    
    // Test with a known FID (Vitalik's FID: 5650)
    const testFid = 5650;
    console.log(`   Testing wallet resolution for FID ${testFid}...`);
    
    const wallet = await neynar.resolveWalletForFid(testFid);
    if (wallet) {
      console.log(`✅ Neynar service working. Resolved FID ${testFid} → ${wallet.slice(0,8)}...`);
    } else {
      console.log('⚠️ Neynar service working, but no wallet found for test FID');
    }
  } catch (error) {
    console.error('❌ Neynar service error:', error.message);
    process.exit(1);
  }
  console.log();

  // Test 3: Zora Service
  console.log('3️⃣ Testing Zora service...');
  try {
    const zoraService = new ZoraService({
      apiKey: process.env.ZORA_API_KEY,
      signerPrivateKey: process.env.ZORA_SIGNER_PRIVATE_KEY,
      chainId: Number(process.env.ZORA_CHAIN_ID || 8453),
      rpcUrl: process.env.ZORA_RPC_URL || 'https://mainnet.base.org',
    });

    if (!zoraService.isConfigured()) {
      console.error('❌ Zora service not properly configured');
      process.exit(1);
    }

    const walletAddress = zoraService.getWalletAddress();
    console.log(`✅ Zora service configured. Wallet: ${walletAddress}`);

    // Test profile fetch (using a known Zora user)
    console.log('   Testing Zora profile fetch...');
    try {
      const profile = await zoraService.getProfileInfo('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'); // vitalik.eth
      console.log(`✅ Zora profile service working. Found ${profile.totalCoins} coins for test user`);
    } catch (profileError) {
      console.log('⚠️ Zora profile fetch failed (API key might need approval):', profileError.message);
    }
  } catch (error) {
    console.error('❌ Zora service error:', error.message);
    process.exit(1);
  }
  console.log();

  // Test 4: Network Configuration
  console.log('4️⃣ Testing network configuration...');
  const chainId = Number(process.env.ZORA_CHAIN_ID || 8453);
  const rpcUrl = process.env.ZORA_RPC_URL || 'https://mainnet.base.org';
  
  console.log(`   Chain ID: ${chainId} (${chainId === 8453 ? 'Base Mainnet' : chainId === 84532 ? 'Base Sepolia' : 'Custom'})`);
  console.log(`   RPC URL: ${rpcUrl}`);
  
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_chainId', 
        params: [],
        id: 1
      })
    });
    
    const result = await response.json();
    const networkChainId = parseInt(result.result, 16);
    
    if (networkChainId === chainId) {
      console.log('✅ Network configuration correct');
    } else {
      console.error(`❌ Chain ID mismatch. Expected ${chainId}, got ${networkChainId}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Network test failed:', error.message);
    process.exit(1);
  }
  console.log();

  // Success!
  console.log('🎉 All tests passed!');
  console.log('');
  console.log('🚀 Your Zora integration is ready to use!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Start the server: npm run dev');
  console.log('2. Open http://localhost:3000/app.html');
  console.log('3. Sign in with Neynar');
  console.log('4. Toggle to "Zora Coin" mode');
  console.log('5. Upload media and create your first coin!');
  console.log('');
  console.log('📚 For detailed instructions, see ZORA_SETUP.md');
}

testZoraIntegration().catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});

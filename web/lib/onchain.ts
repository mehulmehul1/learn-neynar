"use client";
// wagmi + OnchainKit setup focused on Base (8453)
import { createConfig, http } from 'wagmi';
import { base } from 'viem/chains';
import { coinbaseWallet, metaMask } from '@wagmi/connectors';

// Export Base chain for reuse
export const baseChain = base;

// Create wagmi config with Base chain + common connectors
export const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(), // uses viem default RPC for Base
  },
  connectors: [
    coinbaseWallet({ appName: 'Kamo Web', preference: 'all' }),
    // MetaMask/injected covers most browser wallets
    metaMask(),
  ],
});


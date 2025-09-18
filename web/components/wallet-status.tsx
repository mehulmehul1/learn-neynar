"use client";
import React from 'react';
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain, useConnectors } from 'wagmi';
import { base } from 'viem/chains';

function shortAddr(addr?: string) {
  if (!addr) return '';
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

export function WalletStatus() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const { address, status: accountStatus, isConnected } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { connect, status: connectStatus, error } = useConnect();
  const connectors = useConnectors();

  const wrongChain = isConnected && chainId !== base.id;

  function pickConnector() {
    // Prefer MetaMask or Coinbase, else first available
    const mm = connectors.find((c) => c.id === 'metaMask');
    const cbw = connectors.find((c) => c.id === 'coinbaseWalletSDK');
    return mm || cbw || connectors[0];
  }

  if (!mounted) {
    return null;
  }

  if (!isConnected) {
    const c = pickConnector();
    return (
      <button
        onClick={() => c && connect({ connector: c })}
        disabled={!c || connectStatus === 'pending'}
        title={c ? `Connect with ${c.name}` : 'No wallet available'}
        style={{
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid #e9ecef',
          background: 'white',
        }}
      >
        {connectStatus === 'pending' ? 'Connecting…' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: wrongChain ? '#b54708' : '#198754' }}>
        {shortAddr(address)} • {chainId}
      </span>
      {wrongChain ? (
        <button
          onClick={() => switchChain({ chainId: base.id })}
          disabled={switching}
          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #f7c59f', background: '#fff7ed' }}
        >
          {switching ? 'Switching…' : 'Switch to Base'}
        </button>
      ) : (
        <button
          onClick={() => disconnect()}
          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #e9ecef', background: 'white' }}
        >
          Disconnect
        </button>
      )}
    </div>
  );
}


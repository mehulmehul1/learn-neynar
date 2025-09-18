"use client";
import React, { useEffect, useRef, useState } from 'react';
import { getApiBase } from '../lib/api';

declare global {
  interface Window {
    onSignInSuccess?: (payload: any) => void;
  }
}

export function SiwnButton() {
  const [ready, setReady] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || '';

  useEffect(() => {
    if (!clientId) return;

    // Install global success handler once
    window.onSignInSuccess = async (payload: any) => {
      try {
        const fid = payload?.fid || payload?.user?.fid || payload?.data?.fid;
        const signerUuid = payload?.signer_uuid || payload?.signerUuid || payload?.data?.signerUuid;
        if (!fid || !signerUuid) {
          console.warn('SIWN callback missing fid/signerUuid', payload);
          return;
        }
        const primaryBase = getApiBase();
        let res = await fetch(primaryBase + '/auth/siwn/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fid, signerUuid })
        });
        // Fallback: if we accidentally hit the frontend origin (404 HTML), retry backend default
        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          const looksLikeNext404 = txt.includes('This page could not be found');
          if (res.status === 404 || looksLikeNext404) {
            const fallbackBase = 'http://localhost:3000';
            if (fallbackBase !== primaryBase) {
              res = await fetch(fallbackBase + '/auth/siwn/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fid, signerUuid })
              });
            }
          } else {
            throw new Error(txt || 'SIWN session failed');
          }
        }
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        localStorage.setItem('sessionToken', data.token);
        // Soft refresh to let SIWN status refetch
        location.reload();
      } catch (e) {
        console.error('SIWN session error', e);
      }
    };

    // Inject SIWN script if not already present
    const existing = document.querySelector('script[src*="neynarxyz.github.io/siwn"]');
    if (!existing) {
      const script = document.createElement('script');
      script.src = 'https://neynarxyz.github.io/siwn/raw/1.2.0/index.js';
      script.async = true;
      script.onload = () => setReady(true);
      document.body.appendChild(script);
    } else {
      setReady(true);
    }
  }, [clientId]);

  if (!clientId) {
    return <div style={{ color: '#dc3545' }}>[SIWN not configured]</div>;
  }

  return (
    <div ref={containerRef}>
      <div
        className="neynar_signin"
        data-client_id={clientId}
        data-success-callback="onSignInSuccess"
        data-theme="dark"
      />
      {!ready && <span style={{ marginLeft: 8, color: '#6c757d' }}>(loading SIWN…)</span>}
    </div>
  );
}

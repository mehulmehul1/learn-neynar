"use client";
import React, { useEffect, useState } from 'react';
import { getApiBase, authHeaders } from '../lib/api';

export function SiwnStatus() {
  const [status, setStatus] = useState<string>('(loading SIWN)');
  useEffect(() => {
    const run = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null;
        if (!token) {
          setStatus('(not signed in)');
          return; // avoid 401 network noise when no token present
        }
        const res = await fetch(getApiBase() + '/auth/session', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setStatus('(not signed in)');
          return;
        }
        const data = await res.json();
        const approved = !!data?.approved;
        setStatus(`FID ${data?.fid ?? '?'} signer ${approved ? 'approved' : 'pending'}`);
      } catch {
        setStatus('(SIWN error)');
      }
    };
    run();
  }, []);
  return <div style={{ color: '#6c757d' }}>[SIWN: {status}]</div>;
}

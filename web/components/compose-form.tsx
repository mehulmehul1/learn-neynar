"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { getApiBase, authHeaders } from '../lib/api';
import { useAccount, useChainId, useSwitchChain, useWalletClient } from 'wagmi';
import { base } from 'viem/chains';
import type { Hex } from 'viem';

export function ComposeForm() {
  const [mode, setMode] = useState<'cast' | 'zora'>('zora');
  const [title, setTitle] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [metadataUri, setMetadataUri] = useState('');
  const [creatorAddress, setCreatorAddress] = useState('');
  const [log, setLog] = useState<string>('');
  const [pinataGateway, setPinataGateway] = useState<string>('');
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string>('');
  const [uploadedMediaCid, setUploadedMediaCid] = useState<string>('');
  const [uploadedMediaKind, setUploadedMediaKind] = useState<'image'|'video'|'other'|''>('');
  const [metaStatus, setMetaStatus] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  // Prefill creator address from connected wallet
  useEffect(() => {
    if (isConnected && address && !creatorAddress) setCreatorAddress(address);
  }, [isConnected, address, creatorAddress]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const wrongChain = isConnected && chainId !== base.id;
  const disabled = useMemo(
    () => !isConnected || wrongChain,
    [isConnected, wrongChain]
  );

  // Load config for Pinata gateway (mirrors /config usage in app.html)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/config');
        if (!r.ok) return;
        const cfg = await r.json();
        if (!cancelled) setPinataGateway((cfg?.pinataGatewayDomain || '').trim());
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  function previewElement(url: string, kind: 'image'|'video'|'other') {
    if (kind === 'image') {
      return <img src={url} alt="preview" style={{ maxWidth: 240, borderRadius: 6, border: '1px solid #e9ecef55' }} />
    }
    return <a href={url} target="_blank" rel="noreferrer">Open uploaded media</a>;
  }

  async function handleFileChange(file: File) {
    setUploadStatus('Creating signed upload URL…');
    setUploadedMediaUrl('');
    setUploadedMediaCid('');
    setUploadedMediaKind('');
    const kind: 'image'|'video'|'other' = file.type.startsWith('image/') ? 'image' : (file.type.startsWith('video/') ? 'video' : 'other');
    try {
      // 1) Signed upload URL flow
      const r = await fetch('/uploads/pinata/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, network: 'public', expires: 60 }),
      });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      const signedUrl = j?.url as string;
      const fd = new FormData();
      fd.append('file', file);
      fd.append('network', 'public');
      setUploadStatus('Uploading to Pinata…');
      const upRes = await fetch(signedUrl, { method: 'POST', body: fd });
      const upJson = await upRes.json();
      const cid = upJson?.data?.cid || upJson?.cid;
      if (!cid) throw new Error('Upload response missing cid');
      const base = pinataGateway ? `https://${pinataGateway}` : 'https://ipfs.io';
      const url = `${base}/ipfs/${cid}`;
      setUploadedMediaUrl(url);
      setUploadedMediaCid(cid);
      setUploadedMediaKind(kind);
      setUploadStatus(`Uploaded • CID: ${cid}`);
      return;
    } catch (e1: any) {
      // 2) Fallback: backend proxy to Pinata direct
      try {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('network', 'public');
        setUploadStatus('Uploading to Pinata (direct)…');
        const upRes = await fetch('/uploads/pinata/direct', { method: 'POST', body: fd });
        const upJson = await upRes.json();
        if (!upRes.ok) throw new Error(JSON.stringify(upJson));
        const cid = upJson?.data?.cid || upJson?.cid;
        if (!cid) throw new Error('Upload response missing cid');
        const base = pinataGateway ? `https://${pinataGateway}` : 'https://ipfs.io';
        const url = `${base}/ipfs/${cid}`;
        setUploadedMediaUrl(url);
        setUploadedMediaCid(cid);
        setUploadedMediaKind(kind);
        setUploadStatus(`Uploaded • CID: ${cid}`);
        return;
      } catch (e2: any) {
        // 3) Fallback: legacy pinFileToIPFS
        try {
          const fd2 = new FormData();
          fd2.append('file', file);
          setUploadStatus('Uploading to Pinata (legacy)…');
          const upRes2 = await fetch('/uploads/pinata/legacy', { method: 'POST', body: fd2 });
          const upJson2 = await upRes2.json();
          if (!upRes2.ok) throw new Error(JSON.stringify(upJson2));
          const cid = upJson2?.IpfsHash || upJson2?.cid || upJson2?.data?.cid;
          if (!cid) throw new Error('Upload response missing cid');
          const base = pinataGateway ? `https://${pinataGateway}` : 'https://ipfs.io';
          const url = `${base}/ipfs/${cid}`;
          setUploadedMediaUrl(url);
          setUploadedMediaCid(cid);
          setUploadedMediaKind(kind);
          setUploadStatus(`Uploaded • CID: ${cid}`);
          return;
        } catch (e3: any) {
          setUploadStatus(`Upload failed: ${e3?.message || e2?.message || e1?.message || 'Unknown error'}`);
        }
      }
    }
  }

  async function buildMetadata() {
    try {
      setMetaStatus('Building metadata...');
      if (!title) throw new Error('Title required');
      if (!description) throw new Error('Description required');
      if (!uploadedMediaCid) throw new Error('Upload an image/video first');
      const body: any = { title, caption: description, symbol };
      if (uploadedMediaKind === 'image') body.imageCid = uploadedMediaCid;
      else if (uploadedMediaKind === 'video') body.videoCid = uploadedMediaCid;
      else throw new Error('Unsupported media kind for metadata');
      const r = await fetch(getApiBase() + '/zora/coins/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authHeaders() as any) },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      if (!j?.cid) throw new Error('No CID returned');
      setMetadataUri(`ipfs://${j.cid}`);
      setMetaStatus('Metadata pinned ✓');
    } catch (e: any) {
      setMetaStatus(`Metadata error: ${e?.message || String(e)}`);
    }
  }

  // Auto-build metadata like app.html once media + required fields exist
  useEffect(() => {
    (async () => {
      if (!uploadedMediaCid) return;
      if (!title || !description) return;
      if (metadataUri && metadataUri.startsWith('ipfs://')) return;
      // avoid spamming rebuilds if one is in progress
      if (metaStatus.startsWith('Building')) return;
      await buildMetadata();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedMediaCid, title, description]);

  // Server-paid immediate create (app.html parity)
  async function createNowServer() {
    try {
      setLog('Preparing server create...');
      if (!title) throw new Error('Title is required.');
      if (!description) throw new Error('Description is required.');
      if (!uploadedMediaCid && !uploadedMediaUrl) throw new Error('Upload media first');

      // Build metadata if missing
      let metaCid = '';
      if (!metadataUri || !metadataUri.startsWith('ipfs://')) {
        setMetaStatus('Building metadata...');
        const body: any = { title, caption: description, symbol };
        if (uploadedMediaKind === 'image') body.imageCid = uploadedMediaCid;
        if (uploadedMediaKind === 'video') body.videoCid = uploadedMediaCid;
        const r = await fetch(getApiBase() + '/zora/coins/metadata', {
          method: 'POST', headers: { 'Content-Type': 'application/json', ...(authHeaders() as any) },
          body: JSON.stringify(body)
        });
        if (!r.ok) throw new Error(await r.text());
        const j = await r.json();
        metaCid = j?.cid || '';
        if (!metaCid) throw new Error('Metadata build returned no cid');
        setMetadataUri(`ipfs://${metaCid}`);
        setMetaStatus('Metadata pinned ✓');
      } else {
        metaCid = (metadataUri || '').replace('ipfs://', '');
      }

      setLog('Creating coin (server)...');
      const res = await fetch(getApiBase() + '/zora/coins/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authHeaders() as any) },
        body: JSON.stringify({
          title,
          caption: description,
          symbol: symbol || undefined,
          mediaUrl: uploadedMediaUrl || undefined,
          walletAddress: creatorAddress || undefined,
          metadataCid: metaCid || undefined,
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const out = await res.json();
      const tx = out?.transactionHash || out?.txHash;
      if (!tx) throw new Error('Missing transaction hash in response');
      const explorer = 'https://basescan.org/tx/' + tx;
      setLog(`Coin created ✓\nTx: ${tx}\nExplorer: ${explorer}`);
    } catch (e: any) {
      setLog(`Error: ${e?.message ?? String(e)}`);
    }
  }

  async function createNow() {
    try {
      if (!isConnected) throw new Error('Connect your wallet to continue.');
      if (wrongChain) throw new Error('Please switch to Base (8453).');
      if (!title) throw new Error('Title is required.');
      if (!metadataUri || !metadataUri.startsWith('ipfs://')) throw new Error('Metadata URI must start with ipfs://');
      if (!creatorAddress) throw new Error('Creator address is required.');
      setLog('Previewing call...');
      const previewHeaders: HeadersInit = { 'Content-Type': 'application/json', ...(authHeaders() as any) };
      const res = await fetch(getApiBase() + '/zora/coins/call/preview', {
        method: 'POST',
        headers: previewHeaders,
        body: JSON.stringify({ title, symbol, description, metadataUri, creatorAddress, chainId: 8453 })
      });
      if (!res.ok) throw new Error(await res.text());
      const call = await res.json();
      setLog(`Preview OK. to=${call.to} chainId=${call.chainId}. Sending transaction...`);

      if (!walletClient) throw new Error('Wallet client not available');
      if (!call?.to || !call?.data) throw new Error('Preview response missing to/data');
      const valueBigInt = typeof call.value === 'string' && call.value !== '0x0' ? BigInt(call.value) : undefined;
      const txHash: Hex = await walletClient.sendTransaction({
        to: call.to as `0x${string}`,
        data: call.data as Hex,
        value: valueBigInt,
        account: address as any,
      } as any);
      setLog(`Tx sent: ${txHash}. Confirming...`);

      const confirmHeaders: HeadersInit = { 'Content-Type': 'application/json', ...(authHeaders() as any) };
      const confirm = await fetch(getApiBase() + '/zora/coins/create/confirm', {
        method: 'POST',
        headers: confirmHeaders,
        body: JSON.stringify({ txHash, coinAddress: null, metadataUri, creatorAddress })
      });
      if (!confirm.ok) throw new Error(await confirm.text());
      const explorer = 'https://basescan.org/tx/' + txHash;
      setLog(`Success! Tx: ${txHash}\nExplorer: ${explorer}`);
    } catch (e: any) {
      setLog(`Error: ${e?.message ?? String(e)}`);
    }
  }

  return (
    <section>
      <h3>Compose</h3>
      <div style={{ display: 'grid', gap: 8, maxWidth: 720 }}>
        <label>
          Mode:
          <select value={mode} onChange={(e) => setMode(e.target.value as any)}>
            <option value="zora">Zora Coin</option>
            <option value="cast">Cast</option>
          </select>
        </label>
        {mode === 'zora' && (
          <>
            <label>Title <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Coin title" /></label>
            <label>Symbol <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="Optional" /></label>
            <label>Description <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" /></label>
            <div>
              <label>Media (image/video)
                <input type="file" accept="image/*,video/mp4" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileChange(f);
                }} />
              </label>
              <div style={{ color: '#6c757d' }}>{uploadStatus}</div>
              <div style={{ marginTop: 8 }}>
                {uploadedMediaUrl && previewElement(uploadedMediaUrl, uploadedMediaKind || 'other')}
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button onClick={buildMetadata} disabled={!uploadedMediaCid || !title || !description}>
                  Build Metadata (ipfs://)
                </button>
                {!!metaStatus && <span style={{ fontSize: 12, color: '#6c757d' }}>{metaStatus}</span>}
              </div>
            </div>
            <label>Metadata URI <input value={metadataUri} onChange={(e) => setMetadataUri(e.target.value)} placeholder="ipfs://..." /></label>
            <div style={{ fontSize: 12, color: '#6c757d' }}>
              Tip: Upload media and click Build Metadata to auto-fill ipfs:// URI.
            </div>
            <label>Creator Address <input value={creatorAddress} onChange={(e) => setCreatorAddress(e.target.value)} placeholder="0x..." /></label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {mounted && (!isConnected || wrongChain) && (
                <div style={{ fontSize: 12, color: '#b54708', background: '#fff7ed', border: '1px solid #f7c59f', padding: 6, borderRadius: 6 }}>
                  {!isConnected ? 'Connect your wallet to continue.' : 'Please switch to Base (8453) to create.'}
                </div>
              )}
              {wrongChain && (
                <button onClick={() => switchChain({ chainId: base.id })} disabled={switching}>
                  {switching ? 'Switching…' : 'Switch to Base'}
                </button>
              )}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button disabled={disabled} onClick={createNow}>Create Now (user-signed)</button>
                <button onClick={createNowServer}>Create Now (server)</button>
              </div>
            </div>
          </>
        )}
      </div>
      {!!log && <pre style={{ background: '#f8f9fa', marginTop: 8, padding: 8 }}>{log}</pre>}
    </section>
  );
}

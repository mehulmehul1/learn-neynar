import React from 'react';
import { getApiBase } from '../../lib/api';

async function fetchJSON(path: string) {
  const res = await fetch(getApiBase() + path, { cache: 'no-store' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default async function QueuePage() {
  let castQueue: any = { jobs: [] };
  let zoraQueue: any = { jobs: [] };
  try {
    castQueue = await fetchJSON('/casts/queue');
  } catch {}
  try {
    zoraQueue = await fetchJSON('/zora/coins/queue');
  } catch {}

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <h2>Queues</h2>
      <section>
        <h3>Casts</h3>
        <pre style={{ background: '#f8f9fa', padding: 8 }}>{JSON.stringify(castQueue, null, 2)}</pre>
      </section>
      <section>
        <h3>Zora Coins</h3>
        <pre style={{ background: '#f8f9fa', padding: 8 }}>{JSON.stringify(zoraQueue, null, 2)}</pre>
      </section>
    </div>
  );
}


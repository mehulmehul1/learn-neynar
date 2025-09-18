import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors = require('cors');
import { NeynarService } from './neynarClient';
import { ZoraService } from './zoraService';
import crypto from 'crypto';
import path from 'path';
// Minimal typing for Node 18 global fetch (avoid TS lib DOM dependency here)
declare const fetch: any;

// Defer importing SDK-dependent code until after env validation if needed

const app = express();
app.use(express.json());
// Enable simple CORS for local Next.js frontend (adjust origin as needed)
app.use(
  cors({
    origin: (_origin: any, cb: any) => cb(null, true),
    credentials: true,
  })
);

// Simple request logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, url } = req;
  next();
  const ms = Date.now() - start;
  // Keep minimal to avoid noise
  console.log(`${method} ${url} - ${ms}ms`);
});

// Health route
app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'neynar-farcaster-backend' });
});

// Root index route for convenience
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Neynar Farcaster Backend',
    health: '/health',
    endpoints: {
      userCasts: '/farcaster/users/:fid/casts?limit=10',
    },
  });
});

// Simple config endpoint for the demo UI
app.get('/config', (_req: Request, res: Response) => {
  // Read fresh values in case env changed without restart (dev convenience)
  const neynarClientId = (process.env.NEYNAR_CLIENT_ID || NEYNAR_CLIENT_ID || '').trim();
  const pinataGatewayDomain = (process.env.PINATA_GATEWAY_DOMAIN || PINATA_GATEWAY_DOMAIN || '').trim();
  res.json({ neynarClientId, pinataGatewayDomain });
});

// Serve static demo UI from /public (e.g., /app.html)
app.use(express.static(path.join(process.cwd(), 'public')));

// Initialize Neynar client
const apiKey = process.env.NEYNAR_API_KEY || '';
let neynar: NeynarService | null = null;
if (apiKey) {
  neynar = new NeynarService({ apiKey });
} else {
  console.warn('NEYNAR_API_KEY not set. SDK routes will return 500.');
}

// Pinata and Zora config
const PINATA_JWT = process.env.PINATA_JWT || '';
const PINATA_GATEWAY_DOMAIN = process.env.PINATA_GATEWAY_DOMAIN || '';
const NEYNAR_CLIENT_ID = process.env.NEYNAR_CLIENT_ID || '';

// Initialize Zora service
const ZORA_SIGNER_PRIVATE_KEY = (process.env.ZORA_SIGNER_PRIVATE_KEY || '').trim();
const ZORA_CHAIN_ID = Number(process.env.ZORA_CHAIN_ID || 8453); // Base mainnet
const ZORA_RPC_URL = (process.env.ZORA_RPC_URL || 'https://mainnet.base.org').trim();
const ZORA_API_KEY = (process.env.ZORA_API_KEY || '').trim();
const ZORA_PLATFORM_REFERRER = (process.env.ZORA_PLATFORM_REFERRER || '').trim();
const ZORA_TRADER_REFERRER = (process.env.ZORA_TRADER_REFERRER || '').trim();

let zoraService: ZoraService | null = null;
try {
  zoraService = new ZoraService({
    apiKey: ZORA_API_KEY,
    signerPrivateKey: ZORA_SIGNER_PRIVATE_KEY,
    chainId: ZORA_CHAIN_ID,
    rpcUrl: ZORA_RPC_URL,
    platformReferrer: ZORA_PLATFORM_REFERRER || undefined,
    traderReferrer: ZORA_TRADER_REFERRER || undefined,
  });
  
  if (zoraService.isConfigured()) {
    console.log(`Zora service initialized with wallet: ${zoraService.getWalletAddress()}`);
    const refs = zoraService.getReferralConfig();
    if (refs.platformReferrer) console.log(`Zora platformReferrer set: ${refs.platformReferrer}`);
  } else {
    console.warn('Zora service not fully configured. Check ZORA_SIGNER_PRIVATE_KEY and ZORA_API_KEY.');
  }
} catch (error) {
  console.error('Failed to initialize Zora service:', error);
  zoraService = null;
}

// In-memory scheduled jobs store (dev scaffold). Replace with DB in production.
type ScheduledCast = {
  id: string;
  fid?: number; // set once SIWN is wired
  signerUuid?: string; // required for publishing
  text: string;
  mediaUrl?: string;
  when: string; // ISO UTC
  idem: string;
  status: 'pending' | 'publishing' | 'posted' | 'failed' | 'canceled';
  castHash?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

const jobs: ScheduledCast[] = [];

// Zora coin scheduling (scaffold)
type ScheduledZoraCoin = {
  id: string;
  fid?: number; // from session if available
  walletAddress?: string; // optional override; otherwise resolve from fid mapping
  title: string; // coin name
  caption?: string; // description
  symbol?: string; // optional symbol (e.g., KAMO)
  mediaUrl?: string; // image or video URL
  mediaMime?: string; // e.g., image/png, video/mp4
  when: string; // ISO UTC
  status: 'pending' | 'creating' | 'created' | 'failed' | 'canceled';
  txHash?: string;
  coinAddress?: string;
  metadataUri?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

const zoraJobs: ScheduledZoraCoin[] = [];

// Test wallet connection for current session
app.get('/auth/wallet', async (req: Request, res: Response) => {
  try {
    const token = getSessionToken(req);
    if (!token || !sessions.has(token)) return res.status(401).json({ error: 'unauthorized' });
    
    const session = sessions.get(token)!;
    if (!neynar) return res.status(500).json({ error: 'NEYNAR_API_KEY not configured' });

    const walletAddress = await neynar.resolveWalletForFid(session.fid);
    const userProfile = await neynar.getUserProfile(session.fid);

    return res.json({
      fid: session.fid,
      walletAddress,
      username: userProfile?.username,
      displayName: userProfile?.display_name,
      avatar: userProfile?.pfp_url,
      hasWallet: !!walletAddress,
      zoraConfigured: zoraService?.isConfigured() || false,
    });
  } catch (e: any) {
    console.error('wallet connection error:', e);
    return res.status(500).json({ error: 'failed to check wallet connection' });
  }
});

// Debug: Inspect wallet resolution for a given FID
app.get('/debug/fid/:fid/wallet', async (req: Request, res: Response) => {
  try {
    if (!neynar) return res.status(500).json({ error: 'NEYNAR_API_KEY not configured' });
    const fid = Number(req.params.fid);
    if (!Number.isFinite(fid)) return res.status(400).json({ error: 'invalid fid' });

    const user: any = await neynar.fetchUserByFid(fid);
    if (!user) return res.status(404).json({ error: 'user not found for fid' });

    const verifiedEth = user?.verified_addresses?.eth_addresses || [];
    const verifications = user?.verifications || [];
    const custody = user?.custody_address || null;
    const resolved = (await neynar.resolveWalletForFid(fid)) || null;

    return res.json({ fid, resolved, verifiedEth, verifications, custody, username: user?.username, displayName: user?.display_name });
  } catch (e: any) {
    console.error('debug wallet resolution error:', e?.response?.data || e);
    return res.status(500).json({ error: 'debug resolution failed' });
  }
});

// --- Simple bearer-token sessions (no external deps) ---
type Session = { token: string; fid: number; signerUuid: string; createdAt: string };
const sessions = new Map<string, Session>();

function getSessionToken(req: Request) {
  const auth = req.headers['authorization'] || '';
  if (auth.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim();
  const hdr = req.headers['x-session-token'];
  return Array.isArray(hdr) ? hdr[0] : hdr || '';
}

// Example: fetch casts for a user by FID
app.get('/farcaster/users/:fid/casts', async (req, res) => {
  try {
    if (!neynar) throw new Error('NEYNAR_API_KEY not configured');
    const fid = Number(req.params.fid);
    if (!Number.isFinite(fid)) {
      return res.status(400).json({ error: 'Invalid fid' });
    }
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    const includeReplies = req.query.includeReplies
      ? String(req.query.includeReplies).toLowerCase() === 'true'
      : undefined;

    const data: any = await neynar.fetchCastsForUser({ fid, limit, cursor, includeReplies });

    const wantsHtml =
      String(req.query.format || '').toLowerCase() === 'html' ||
      (req.headers.accept || '').includes('text/html');

    if (!wantsHtml) {
      return res.json(data);
    }

    const casts: any[] = Array.isArray(data?.casts) ? data.casts : [];

    const escapeHtml = (str: string) =>
      String(str).replace(/[&<>"']/g, (ch) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[ch]
      );

    const items = casts
      .map((c: any) => {
        const author = c?.author?.username || c?.author?.fid || 'unknown';
        const time = c?.timestamp ? new Date(c.timestamp).toLocaleString() : '';
        const text = escapeHtml(c?.text || '');
        return `
          <article class="cast">
            <div class="meta">@${escapeHtml(author)} • ${escapeHtml(time)}</div>
            <div class="cast-text">${text || '<em>(no text)</em>'}</div>
          </article>
        `;
      })
      .join('\n');

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>User ${fid} casts</title>
  <style>
    :root { color-scheme: light dark; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 24px; line-height: 1.4; }
    header { margin-bottom: 16px; }
    .meta { color: #6c757d; font-size: 0.9rem; margin-bottom: 4px; }
    .cast { padding: 12px 0; border-bottom: 1px solid #e9ecef22; }
    .cast-text { color: #0a58ca; white-space: pre-wrap; font-size: 1.05rem; }
    .footer { margin-top: 16px; font-size: 0.9rem; }
    a { color: #0a58ca; text-decoration: none; }
  </style>
  </head>
<body>
  <header>
    <h1>Farcaster Casts for FID ${fid}</h1>
  </header>
  <main>
    ${items || '<p>No casts found.</p>'}
  </main>
  <div class="footer">
    <p>Showing ${casts.length} cast(s). <a href="?limit=${limit ?? ''}&cursor=${cursor ?? ''}&includeReplies=${includeReplies ?? ''}&format=json">View JSON</a></p>
  </div>
</body>
</html>`;

    res.set('Content-Type', 'text/html; charset=utf-8').send(html);
  } catch (err: any) {
    console.error('Error fetching user casts:', err?.response?.data || err);
    res.status(500).json({ error: 'Failed to fetch user casts' });
  }
});

// --- SIWN session endpoints ---
// Client calls this after SIWN success callback with fid + signerUuid to establish a backend session
app.post('/auth/siwn/session', async (req: Request, res: Response) => {
  try {
    const { fid, signerUuid } = req.body || {};
    const fidNum = Number(fid);
    if (!Number.isFinite(fidNum)) return res.status(400).json({ error: 'invalid fid' });
    if (!signerUuid || typeof signerUuid !== 'string') return res.status(400).json({ error: 'signerUuid required' });
    if (!neynar) throw new Error('NEYNAR_API_KEY not configured');

    // Verify signer exists and check approval status
    let approved = false;
    try {
      const resp: any = await neynar.lookupSigner({ signerUuid });
      // SDK shapes vary; attempt common fields
      const status = resp?.status || resp?.result?.status || resp?.signer_status;
      approved = String(status || '').toLowerCase() === 'approved' || status === 2;
    } catch (e: any) {
      console.warn('lookupSigner failed; proceeding but marking approved=false', e?.response?.data || e?.message);
    }

    const token = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    sessions.set(token, { token, fid: fidNum, signerUuid, createdAt });
    return res.status(201).json({ token, fid: fidNum, signerUuid, approved });
  } catch (e: any) {
    console.error('siwn session error:', e);
    return res.status(500).json({ error: 'failed to create session' });
  }
});

// Returns the current session + live signer status
app.get('/auth/session', async (req: Request, res: Response) => {
  try {
    const token = getSessionToken(req);
    if (!token || !sessions.has(token)) return res.status(401).json({ error: 'unauthorized' });
    const sess = sessions.get(token)!;
    let approved = false;
    let status: any = undefined;
    if (neynar) {
      try {
        const resp: any = await neynar.lookupSigner({ signerUuid: sess.signerUuid });
        status = resp?.status || resp?.result?.status || resp?.signer_status;
        approved = String(status || '').toLowerCase() === 'approved' || status === 2;
      } catch {}
    }
    return res.json({ ...sess, status, approved });
  } catch (e: any) {
    console.error('get session error:', e);
    return res.status(500).json({ error: 'failed to get session' });
  }
});

// Poll signer status by current session
app.get('/signer/status', async (req: Request, res: Response) => {
  try {
    const token = getSessionToken(req);
    if (!token || !sessions.has(token)) return res.status(401).json({ error: 'unauthorized' });
    const sess = sessions.get(token)!;
    if (!neynar) throw new Error('NEYNAR_API_KEY not configured');
    const resp: any = await neynar.lookupSigner({ signerUuid: sess.signerUuid });
    const status = resp?.status || resp?.result?.status || resp?.signer_status;
    const approved = String(status || '').toLowerCase() === 'approved' || status === 2;
    return res.json({ status, approved });
  } catch (e: any) {
    console.error('signer status error:', e?.response?.data || e);
    return res.status(500).json({ error: 'failed to get signer status' });
  }
});

// --- Uploads: Pinata signed URL ---
// Creates a short-lived signed upload URL so the client can upload directly to Pinata without exposing JWT
app.post('/uploads/pinata/sign', async (req: Request, res: Response) => {
  try {
    const jwt = (process.env.PINATA_JWT || PINATA_JWT || '').trim();
    if (!jwt) return res.status(500).json({ error: 'PINATA_JWT not configured' });
    if (jwt.startsWith(' ')) console.warn('PINATA_JWT has leading space; trimming');
    console.log(`Pinata sign requested (jwt length=${jwt.length})`);

    // Allow overrides via body, with safe defaults
    const { filename, expires = 60, groupId, network = 'public' } = req.body || {};

    const payload: Record<string, any> = { network, expires: Number(expires) || 60 };
    if (filename) payload.filename = String(filename);
    if (groupId) payload.group_id = String(groupId);

    const r = await fetch('https://uploads.pinata.cloud/v3/files/sign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const errTxt = await r.text();
      console.error('Pinata sign error:', r.status, errTxt);
      return res.status(502).json({ error: 'Failed to create signed upload URL', upstream: errTxt, status: r.status });
    }
    const data: any = await r.json();
    // Pinata returns { data: <signedUrl> }
    return res.json({ url: data?.data, expires: payload.expires });
  } catch (e: any) {
    console.error('Pinata sign exception:', e);
    return res.status(500).json({ error: 'Pinata sign failed' });
  }
});

// Proxy direct upload to Pinata without creating a signed URL (server holds JWT)
app.post('/uploads/pinata/direct', async (req: Request, res: Response) => {
  try {
    const jwt = (process.env.PINATA_JWT || PINATA_JWT || '').trim();
    if (!jwt) return res.status(500).json({ error: 'PINATA_JWT not configured' });

    const contentType = String(req.headers['content-type'] || '');
    if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
    }

    const upstream = await fetch('https://uploads.pinata.cloud/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': contentType,
        'accept': 'application/json',
      },
      // Node fetch streaming requires duplex
      duplex: 'half' as any,
      body: req as any,
    });

    const txt = await upstream.text();
    res.status(upstream.status).type(upstream.headers.get('content-type') || 'application/json').send(txt);
  } catch (e: any) {
    console.error('Pinata direct upload exception:', e);
    return res.status(500).json({ error: 'Pinata direct upload failed' });
  }
});

// Legacy proxy using pinFileToIPFS (works with standard API JWT)
app.post('/uploads/pinata/legacy', async (req: Request, res: Response) => {
  try {
    const jwt = (process.env.PINATA_JWT || PINATA_JWT || '').trim();
    const key = (process.env.PINATA_API_KEY || '').trim();
    const secret = (process.env.PINATA_API_SECRET || '').trim();
    if (!jwt && !(key && secret)) return res.status(500).json({ error: 'Provide PINATA_JWT or PINATA_API_KEY + PINATA_API_SECRET' });

    const contentType = String(req.headers['content-type'] || '');
    if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
    }

    const headers: any = {
      'Content-Type': contentType,
      'accept': 'application/json',
    };
    if (key && secret) {
      headers['pinata_api_key'] = key;
      headers['pinata_secret_api_key'] = secret;
    } else {
      headers['Authorization'] = `Bearer ${jwt}`;
    }

    const upstream = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers,
      duplex: 'half' as any,
      body: req as any,
    });

    const txt = await upstream.text();
    res.status(upstream.status).type(upstream.headers.get('content-type') || 'application/json').send(txt);
  } catch (e: any) {
    console.error('Pinata legacy upload exception:', e);
    return res.status(500).json({ error: 'Pinata legacy upload failed' });
  }
});

// Debug: Check Pinata auth quickly
app.get('/uploads/pinata/test-auth', async (_req: Request, res: Response) => {
  try {
    const jwt = (process.env.PINATA_JWT || PINATA_JWT || '').trim();
    if (!jwt) return res.status(500).json({ ok: false, error: 'PINATA_JWT not configured' });
    const r = await fetch('https://api.pinata.cloud/data/testAuthentication', {
      method: 'GET',
      headers: { accept: 'application/json', authorization: `Bearer ${jwt}` },
    });
    const text = await r.text();
    return res.status(r.status).send(text);
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// Debug: Show Pinata config presence (sanitized)
app.get('/uploads/pinata/config', (_req: Request, res: Response) => {
  const jwt = (process.env.PINATA_JWT || PINATA_JWT || '').trim();
  const masked = jwt ? `${jwt.slice(0, 6)}...${jwt.slice(-6)}` : '';
  res.json({
    hasJWT: !!jwt,
    jwtLen: jwt.length,
    jwtPreview: masked,
    gatewayDomain: (process.env.PINATA_GATEWAY_DOMAIN || PINATA_GATEWAY_DOMAIN || '').trim(),
  });
});

// --- Scheduling API ---
app.post('/casts/schedule', async (req: Request, res: Response) => {
  try {
    let { text, mediaUrl, when, idem, signerUuid, fid } = req.body || {};
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text required' });
    if (!when || typeof when !== 'string') return res.status(400).json({ error: 'when (ISO) required' });
    const whenDate = new Date(when);
    if (Number.isNaN(whenDate.getTime())) return res.status(400).json({ error: 'invalid when' });
    if (whenDate.getTime() < Date.now() - 1000) return res.status(400).json({ error: 'when must be in the future' });

    // If not provided, pull signer/fid from session (if any)
    if (!signerUuid || !fid) {
      const token = getSessionToken(req);
      if (token && sessions.has(token)) {
        const sess = sessions.get(token)!;
        signerUuid = signerUuid || sess.signerUuid;
        fid = typeof fid === 'number' && Number.isFinite(fid) ? fid : sess.fid;
      }
    }

    const id = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    const job: ScheduledCast = {
      id,
      fid: Number.isFinite(Number(fid)) ? Number(fid) : undefined,
      signerUuid: typeof signerUuid === 'string' ? signerUuid : undefined,
      text,
      mediaUrl: typeof mediaUrl === 'string' ? mediaUrl : undefined,
      when: whenDate.toISOString(),
      idem: typeof idem === 'string' && idem ? idem : `idem_${id}`,
      status: 'pending',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    jobs.push(job);
    return res.status(201).json({ job });
  } catch (e: any) {
    console.error('schedule error:', e);
    return res.status(500).json({ error: 'schedule failed' });
  }
});

app.get('/casts/queue', async (req: Request, res: Response) => {
  try {
    let { status, fid } = req.query as any;
    if (!fid) {
      const token = getSessionToken(req);
      if (token && sessions.has(token)) fid = sessions.get(token)!.fid;
    }
    let out = jobs.slice().sort((a, b) => a.when.localeCompare(b.when));
    if (status && typeof status === 'string') out = out.filter((j) => j.status === status);
    if (fid && Number.isFinite(Number(fid))) out = out.filter((j) => j.fid === Number(fid));
    return res.json({ jobs: out });
  } catch (e: any) {
    console.error('queue error:', e);
    return res.status(500).json({ error: 'queue failed' });
  }
});

app.post('/casts/:id/cancel', async (req: Request, res: Response) => {
  try {
    const idx = jobs.findIndex((j) => j.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'not found' });
    if (jobs[idx].status !== 'pending') return res.status(400).json({ error: 'only pending can be canceled' });
    jobs[idx].status = 'canceled';
    jobs[idx].updatedAt = new Date().toISOString();
    return res.json({ job: jobs[idx] });
  } catch (e: any) {
    console.error('cancel error:', e);
    return res.status(500).json({ error: 'cancel failed' });
  }
});

app.post('/casts/:id/reschedule', async (req: Request, res: Response) => {
  try {
    const { when } = req.body || {};
    const idx = jobs.findIndex((j) => j.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'not found' });
    if (jobs[idx].status !== 'pending') return res.status(400).json({ error: 'only pending can be rescheduled' });
    const whenDate = new Date(when);
    if (Number.isNaN(whenDate.getTime())) return res.status(400).json({ error: 'invalid when' });
    if (whenDate.getTime() < Date.now() - 1000) return res.status(400).json({ error: 'when must be in the future' });
    jobs[idx].when = whenDate.toISOString();
    jobs[idx].updatedAt = new Date().toISOString();
    return res.json({ job: jobs[idx] });
  } catch (e: any) {
    console.error('reschedule error:', e);
    return res.status(500).json({ error: 'reschedule failed' });
  }
});

// Worker endpoint (serverless cron compatible)
async function processDueJobs() {
  const now = Date.now();
  const due = jobs.filter((j) => j.status === 'pending' && new Date(j.when).getTime() <= now);
  const results: any[] = [];
  for (const job of due) {
    job.status = 'publishing';
    job.updatedAt = new Date().toISOString();
    try {
      const embeds = job.mediaUrl ? [{ url: job.mediaUrl }] : [];
      if (!neynar) throw new Error('NEYNAR_API_KEY not configured');
      if (!job.signerUuid) throw new Error('signerUuid missing on job');
      const response: any = await neynar.publishCast({
        signerUuid: job.signerUuid,
        text: job.text,
        embeds,
        idem: job.idem,
      });
      const cast = response?.cast || response; // SDK v1/v2 compatibility
      job.castHash = cast?.hash || cast?.cast?.hash || cast?.result?.hash;
      job.status = 'posted';
      job.updatedAt = new Date().toISOString();
      results.push({ id: job.id, ok: true, hash: job.castHash });
    } catch (err: any) {
      console.error('publish error for job', job.id, err?.response?.data || err);
      job.status = 'failed';
      job.error = String(err?.response?.data?.message || err?.message || err);
      job.updatedAt = new Date().toISOString();
      results.push({ id: job.id, ok: false, error: job.error });
    }
  }
  return results;
}

// Worker endpoint (serverless cron compatible)
app.post('/tasks/run', async (_req: Request, res: Response) => {
  try {
    const results = await processDueJobs();
    return res.json({ processed: results.length, results });
  } catch (e: any) {
    console.error('tasks/run error:', e);
    return res.status(500).json({ error: 'tasks run failed' });
  }
});

// --- Zora Coins: immediate creation endpoint ---
app.post('/zora/coins/create', async (req: Request, res: Response) => {
  try {
    let { title, caption, mediaUrl, symbol, walletAddress, fid, metadataCid, metadataUri } = req.body || {};
    
    if (!title || typeof title !== 'string') return res.status(400).json({ error: 'title required' });
    if (!caption || typeof caption !== 'string') return res.status(400).json({ error: 'caption required' });
    if (!mediaUrl || typeof mediaUrl !== 'string') return res.status(400).json({ error: 'mediaUrl required' });

    if (!zoraService) return res.status(500).json({ error: 'Zora service not configured' });
    if (!zoraService.isConfigured()) return res.status(500).json({ error: 'Zora service not properly configured' });

    // Get session info for fid if not provided
    if (!fid) {
      const token = getSessionToken(req);
      if (token && sessions.has(token)) fid = sessions.get(token)!.fid;
    }

    // Resolve creator address
    let creatorAddress = walletAddress;
    if (!creatorAddress && fid && neynar) {
      creatorAddress = await neynar.resolveWalletForFid(Number(fid));
    }

    if (!creatorAddress) {
      return res.status(400).json({ 
        error: 'Creator wallet address required. Please connect your wallet or provide walletAddress.' 
      });
    }

    // Resolve metadata URI
    let metaUri = typeof metadataUri === 'string' && metadataUri.startsWith('ipfs://') ? metadataUri : '';
    if (!metaUri && typeof metadataCid === 'string' && metadataCid) metaUri = `ipfs://${metadataCid}`;
    if (!metaUri) {
      return res.status(400).json({ error: 'metadataUri or metadataCid required. Build metadata first.' });
    }

    // Create the content coin immediately
    const result = await zoraService.createContentCoin({
      title,
      description: caption,
      creatorAddress,
      metadataUri: metaUri,
      symbol,
    });

    return res.status(201).json({
      success: true,
      coinAddress: result.coinAddress,
      transactionHash: result.transactionHash,
      creatorAddress: result.creatorAddress,
      title,
      description: caption,
      mediaUrl,
    });
  } catch (e: any) {
    console.error('zora coin creation error:', e?.response?.data || e);
    return res.status(500).json({ error: 'failed to create zora coin', details: e?.response?.data || e?.message || String(e) });
  }
});

// --- Zora Coins: scheduling endpoints (scaffold) ---
// Build and pin metadata JSON for a coin using Pinata
app.post('/zora/coins/metadata', async (req: Request, res: Response) => {
  try {
    const jwt = (process.env.PINATA_JWT || PINATA_JWT || '').trim();
    const apiKey = (process.env.PINATA_API_KEY || '').trim();
    const apiSecret = (process.env.PINATA_API_SECRET || '').trim();

    if (!jwt && !(apiKey && apiSecret)) {
      return res.status(500).json({ error: 'Pinata credentials not configured. Provide PINATA_JWT or PINATA_API_KEY + PINATA_API_SECRET.' });
    }

    const { title, caption, symbol, imageCid, videoCid } = req.body || {};
    if (!title || typeof title !== 'string') return res.status(400).json({ error: 'title required' });
    if (!caption || typeof caption !== 'string') return res.status(400).json({ error: 'caption required' });
    if (!imageCid && !videoCid) return res.status(400).json({ error: 'imageCid or videoCid required' });
    const meta: any = { name: title, description: caption };
    if (typeof symbol === 'string' && symbol) meta.symbol = symbol;
    if (imageCid) meta.image = `ipfs://${String(imageCid)}`;
    if (videoCid) meta.animation_url = `ipfs://${String(videoCid)}`;

    const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

    async function tryJwt() {
      if (!jwt) return null;
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', Authorization: `Bearer ${jwt}` }, body: JSON.stringify({ pinataContent: meta }) });
      return r;
    }
    async function tryKeys() {
      if (!(apiKey && apiSecret)) return null;
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'pinata_api_key': apiKey, 'pinata_secret_api_key': apiSecret }, body: JSON.stringify({ pinataContent: meta }) });
      return r;
    }

    let resp = await tryJwt();
    if (resp && (resp.status === 401 || resp.status === 403)) {
      console.warn('Pinata JWT rejected (401/403). Falling back to API key/secret.');
      resp = null;
    }
    if (!resp) resp = await tryKeys();
    if (!resp) return res.status(500).json({ error: 'No valid Pinata auth available' });

    const txt = await resp.text();
    if (!resp.ok) return res.status(resp.status).type('application/json').send(txt);
    const j = JSON.parse(txt);
    const cid = j?.IpfsHash || j?.data?.cid || j?.cid;
    if (!cid) return res.status(502).json({ error: 'pinata did not return cid', upstream: j });
    const base = (process.env.PINATA_GATEWAY_DOMAIN || PINATA_GATEWAY_DOMAIN || '').trim()
      ? `https://${(process.env.PINATA_GATEWAY_DOMAIN || PINATA_GATEWAY_DOMAIN).trim()}`
      : 'https://ipfs.io';
    return res.json({ cid, url: `${base}/ipfs/${cid}` });
  } catch (e: any) {
    console.error('zora metadata error:', e);
    return res.status(500).json({ error: 'metadata build failed' });
  }
});

app.post('/zora/coins/schedule', async (req: Request, res: Response) => {
  try {
    let { title, caption, symbol, mediaUrl, mediaMime, when, walletAddress, fid, metadataCid, metadataUri } = req.body || {};
    
    if (!title || typeof title !== 'string') return res.status(400).json({ error: 'title required' });
    if (!caption || typeof caption !== 'string') return res.status(400).json({ error: 'caption required' });
    if (!mediaUrl || typeof mediaUrl !== 'string') return res.status(400).json({ error: 'mediaUrl required' });
    if (!when || typeof when !== 'string') return res.status(400).json({ error: 'when (ISO) required' });
    
    const whenDate = new Date(when);
    if (Number.isNaN(whenDate.getTime())) return res.status(400).json({ error: 'invalid when' });
    if (whenDate.getTime() < Date.now() - 1000) return res.status(400).json({ error: 'when must be in the future' });

    // Get session info for fid if not provided
    if (!fid) {
      const token = getSessionToken(req);
      if (token && sessions.has(token)) fid = sessions.get(token)!.fid;
    }

    // Resolve creator address
    let creatorAddress = walletAddress;
    if (!creatorAddress && fid && neynar) {
      creatorAddress = await neynar.resolveWalletForFid(Number(fid));
    }

    if (!creatorAddress) {
      return res.status(400).json({ 
        error: 'Creator wallet address required. Please connect your wallet or provide walletAddress.' 
      });
    }

    // Compute metadataUri if provided as CID
    const metaUri = typeof metadataUri === 'string' && metadataUri.startsWith('ipfs://')
      ? metadataUri
      : (typeof metadataCid === 'string' && metadataCid ? `ipfs://${metadataCid}` : undefined);

    const id = crypto.randomUUID();
    const nowIso = new Date().toISOString();
    
    const job: ScheduledZoraCoin = {
      id,
      fid: Number.isFinite(Number(fid)) ? Number(fid) : undefined,
      walletAddress: creatorAddress,
      title,
      caption,
      symbol: typeof symbol === 'string' ? symbol : undefined,
      mediaUrl,
      mediaMime: typeof mediaMime === 'string' ? mediaMime : undefined,
      when: whenDate.toISOString(),
      metadataUri: metaUri,
      status: 'pending',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    
    zoraJobs.push(job);
    return res.status(201).json({ job });
  } catch (e: any) {
    console.error('zora schedule error:', e);
    return res.status(500).json({ error: 'zora schedule failed' });
  }
});

// Zora: Return a minimal profile by identifier (handle or address) or by FID via username
app.get('/zora/profile', async (req: Request, res: Response) => {
  try {
    let fidStr = (req.query.fid as string) || '';
    const addressParam = (req.query.address as string) || '';
    const handleParam = (req.query.handle as string) || '';
    const identifierParam = (req.query.identifier as string) || '';

    // Prefer explicit identifier/handle/address if provided
    let identifier = identifierParam || handleParam || addressParam;

    // Fallback: use session fid if not provided explicitly
    if (!identifier && !fidStr) {
      const token = getSessionToken(req);
      if (token && sessions.has(token)) fidStr = String(sessions.get(token)!.fid);
    }

    // If FID provided and no explicit identifier, resolve username first (preferred)
    if (!identifier && fidStr) {
      const fidNum = Number(fidStr);
      if (!Number.isFinite(fidNum)) return res.status(400).json({ error: 'invalid fid' });
      if (!neynar) return res.status(500).json({ error: 'NEYNAR_API_KEY not configured' });

      const user = await neynar.getUserProfile(fidNum);
      const username = user?.username ? String(user.username) : '';

      if (username) {
        // Try Zora profile by handle (with and without '@')
        const candidates = username.startsWith('@') ? [username.slice(1), username] : [username, `@${username}`];
        for (const cand of candidates) {
          try {
            if (!zoraService) return res.status(500).json({ error: 'Zora service not configured' });
            const p = await zoraService.getProfileInfo(cand);
            return res.json(p);
          } catch (e) {
            // Continue to next candidate
          }
        }
        // If username mapping failed, return a clear 404 with guidance
        return res.status(404).json({
          error: 'No Zora profile found for this username',
          username,
          hint: 'Ensure the Zora handle matches the Farcaster username, or provide ?address=0x... or ?handle=<zora_handle>.',
        });
      }

      // If no username present, we cannot proceed without address/handle
      return res.status(404).json({ error: 'No username found for this FID; provide ?handle= or ?address=' });
    }

    if (!identifier) return res.status(400).json({ error: 'identifier, handle, address or fid required' });
    if (!zoraService) return res.status(500).json({ error: 'Zora service not configured' });

    const profileInfo = await zoraService.getProfileInfo(identifier);
    return res.json(profileInfo);
  } catch (e: any) {
    console.error('zora profile error:', e?.response?.data || e);
    return res.status(500).json({ error: 'failed to fetch zora profile' });
  }
});

app.get('/zora/coins/queue', async (req: Request, res: Response) => {
  try {
    let { status, fid } = req.query as any;
    if (!fid) {
      const token = getSessionToken(req);
      if (token && sessions.has(token)) fid = sessions.get(token)!.fid;
    }
    let out = zoraJobs.slice().sort((a, b) => a.when.localeCompare(b.when));
    if (status && typeof status === 'string') out = out.filter((j) => j.status === status);
    if (fid && Number.isFinite(Number(fid))) out = out.filter((j) => j.fid === Number(fid));
    return res.json({ jobs: out });
  } catch (e: any) {
    console.error('zora queue error:', e);
    return res.status(500).json({ error: 'zora queue failed' });
  }
});

app.post('/zora/coins/:id/cancel', async (req: Request, res: Response) => {
  try {
    const idx = zoraJobs.findIndex((j) => j.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'not found' });
    if (zoraJobs[idx].status !== 'pending') return res.status(400).json({ error: 'only pending can be canceled' });
    zoraJobs[idx].status = 'canceled';
    zoraJobs[idx].updatedAt = new Date().toISOString();
    return res.json({ job: zoraJobs[idx] });
  } catch (e: any) {
    console.error('zora cancel error:', e);
    return res.status(500).json({ error: 'zora cancel failed' });
  }
});

// Zora worker: process due coin creation jobs using ZoraService
async function processDueZoraJobs() {
  const now = Date.now();
  const due = zoraJobs.filter((j) => j.status === 'pending' && new Date(j.when).getTime() <= now);
  const results: any[] = [];
  
  for (const job of due) {
    job.status = 'creating';
    job.updatedAt = new Date().toISOString();
    
    try {
      if (!zoraService) throw new Error('Zora service not initialized');
      if (!zoraService.isConfigured()) throw new Error('Zora service not properly configured');
      if (!job.walletAddress) throw new Error('Creator wallet address missing on job');
      if (!job.metadataUri) throw new Error('Metadata URI required for content coin');

      // Create content coin using the new service
      const result = await zoraService.createContentCoin({
        title: job.title,
        description: job.caption || job.title,
        creatorAddress: job.walletAddress,
        metadataUri: job.metadataUri,
        symbol: job.symbol,
      });

      job.txHash = result.transactionHash;
      job.coinAddress = result.coinAddress;
      job.status = 'created';
      job.updatedAt = new Date().toISOString();
      
      results.push({ 
        id: job.id, 
        ok: true, 
        coinAddress: job.coinAddress, 
        txHash: job.txHash 
      });
    } catch (err: any) {
      console.error('zora create error for job', job.id, err);
      job.status = 'failed';
      job.error = String(err?.message || err);
      job.updatedAt = new Date().toISOString();
      results.push({ id: job.id, ok: false, error: job.error });
    }
  }
  
  return results;
}

// Combined worker: process both Farcaster and Zora jobs
app.post('/zora/tasks/run', async (_req: Request, res: Response) => {
  try {
    const castResults = await processDueJobs();
    const zoraResults = await processDueZoraJobs();
    return res.json({ castsProcessed: castResults.length, zoraProcessed: zoraResults.length, castResults, zoraResults });
  } catch (e: any) {
    console.error('zora tasks/run error:', e);
    return res.status(500).json({ error: 'zora tasks run failed' });
  }
});

// --- MA-2: EOA Create Now support (preview + confirm) ---
app.post('/zora/coins/call/preview', async (req: Request, res: Response) => {
  try {
    const { title, symbol, description, metadataUri, creatorAddress, chainId } = req.body || {};
    if (!title || typeof title !== 'string') return res.status(400).json({ error: 'title required' });
    if (!metadataUri || typeof metadataUri !== 'string' || !metadataUri.startsWith('ipfs://')) return res.status(400).json({ error: 'metadataUri (ipfs://...) required' });
    if (!creatorAddress || typeof creatorAddress !== 'string') return res.status(400).json({ error: 'creatorAddress required' });

    const desiredChainId = Number(chainId || 8453);
    if (desiredChainId !== 8453 && desiredChainId !== 84532) {
      return res.status(400).json({ error: 'Unsupported chainId. Use 8453 (Base) or 84532 (Base Sepolia).' });
    }

    if (!zoraService) return res.status(500).json({ error: 'Zora service not configured' });

    const tx = await zoraService.buildCreateCoinCall({
      title,
      symbol,
      metadataUri,
      creatorAddress,
    });

    // Force chainId to the requested one if provided
    if (tx && typeof tx.chainId === 'number') {
      tx.chainId = desiredChainId;
    }
    return res.json(tx);
  } catch (e: any) {
    console.error('preview error:', e?.response?.data || e?.message || e);
    return res.status(500).json({ error: 'preview failed', details: e?.message || String(e) });
  }
});

app.post('/zora/coins/create/confirm', async (req: Request, res: Response) => {
  try {
    const { txHash, coinAddress, metadataUri, creatorAddress } = req.body || {};
    if (!txHash || !creatorAddress) {
      return res.status(400).json({ error: 'txHash and creatorAddress are required' });
    }
    // For now, just acknowledge – persistence can be added when DB lands (Story 1.1)
    return res.json({ ok: true, txHash, coinAddress: coinAddress || null, metadataUri, creatorAddress });
  } catch (e: any) {
    console.error('confirm error:', e);
    return res.status(500).json({ error: 'confirm failed' });
  }
});

// Dev auto-runner: process due jobs every DEV_CRON_MS (default 30000ms)
const DEV_CRON_MS = Number(process.env.DEV_CRON_MS || 30000);
if (DEV_CRON_MS > 0) {
  setInterval(async () => {
    try {
      const castResults = await processDueJobs();
      const zoraResults = await processDueZoraJobs();
      if (castResults.length || zoraResults.length) {
        console.log(`Auto worker processed casts=${castResults.length}, zora=${zoraResults.length}`);
      }
    } catch (e) {
      console.error('auto worker error:', e);
    }
  }, DEV_CRON_MS);
}

// Centralized error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

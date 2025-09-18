export function getApiBase() {
  const envBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;

    // If UI is on 3001 (Next dev), prefer backend on 3000
    const devBackend = `${protocol}//${hostname}:3000`;

    if (envBase) {
      try {
        const u = new URL(envBase, `${protocol}//${hostname}${port ? `:${port}` : ''}`);
        // If env points to the UI origin (e.g., 3001), override to backend 3000
        const isUiOrigin = (u.hostname === hostname) && (u.port === port || (!u.port && !port));
        const isUiDev = isUiOrigin && (port === '3001');
        if (isUiDev) return devBackend;
        return `${u.protocol}//${u.hostname}${u.port ? `:${u.port}` : ''}`;
      } catch {
        // Malformed env, fall through
      }
    }

    if (port === '3001') return devBackend;
    // Fallback to same origin (useful if proxied in prod)
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  }
  // Server-side fallback (scripts)
  return envBase || 'http://localhost:3000';
}

export function authHeaders() {
  const token = (typeof window !== 'undefined' && localStorage.getItem('sessionToken')) || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

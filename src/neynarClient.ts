import { NeynarAPIClient, Configuration } from '@neynar/nodejs-sdk';

export type NeynarServiceOptions = {
  apiKey: string;
};

export class NeynarService {
  private client: NeynarAPIClient;

  constructor(opts: NeynarServiceOptions) {
    if (!opts.apiKey) {
      throw new Error('NEYNAR_API_KEY is required');
    }
    const config = new Configuration({ apiKey: opts.apiKey });
    this.client = new NeynarAPIClient(config);
  }

  async fetchCastsForUser(params: {
    fid: number;
    limit?: number;
    cursor?: string;
    includeReplies?: boolean | null;
    appFid?: number;
    viewerFid?: number;
    parentUrl?: string;
    channelId?: string;
  }) {
    return this.client.fetchCastsForUser(params);
  }

  async publishCast(params: {
    signerUuid: string;
    text: string;
    embeds?: { url: string }[];
    idem?: string;
    parent?: string;
    parentAuthorFid?: number;
  }) {
    return this.client.publishCast(params as any);
  }

  async lookupSigner(params: { signerUuid: string }) {
    return this.client.lookupSigner(params as any);
  }

  // Fetch a single user record by FID (raw SDK shape)
  async fetchUserByFid(fid: number) {
    const resp = await this.client.fetchBulkUsers({ fids: [fid] } as any);
    return resp?.users?.[0] || resp?.result?.users?.[0] || null;
  }

  // Best-effort wallet resolution via Neynar (verified or custody address)
  async resolveWalletForFid(fid: number): Promise<string | null> {
    try {
      // Fetch user data by FID (SDK expects object with fids)
      const response = await this.client.fetchBulkUsers({ fids: [fid] } as any);
      const users = (response?.users || response?.result?.users || []) as any[];
      if (users.length === 0) return null;

      const user = users[0];

      // 1) Newer shape: verified_addresses.eth_addresses: string[]
      const verifiedEth: string[] = user?.verified_addresses?.eth_addresses || [];
      if (Array.isArray(verifiedEth) && verifiedEth.length > 0) return verifiedEth[0];

      // 2) Older/common shape: verifications: string[] (addresses)
      const verifications: string[] = (user as any)?.verifications || [];
      if (Array.isArray(verifications) && verifications.length > 0) return verifications[0];

      // 3) Fallback: custody_address
      const custody = user?.custody_address;
      if (typeof custody === 'string' && custody) return custody;

      return null;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        console.error('Neynar API auth failed while resolving wallet. Check NEYNAR_API_KEY.');
      }
      console.error('Error resolving wallet for FID:', fid, error?.response?.data || error?.message || error);
      return null;
    }
  }

  // Get user profile information including verification status
  async getUserProfile(fid: number) {
    try {
      const response = await this.client.fetchBulkUsers({ fids: [fid] } as any);
      return response?.users?.[0] || response?.result?.users?.[0] || null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }
}

import { 
  createCoin,
  createCoinCall,
  setApiKey,
  getProfile,
  getProfileCoins,
} from '@zoralabs/coins-sdk';
import { createPublicClient, createWalletClient, http, type Address, isAddress } from 'viem';
import { base, baseSepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

export type ZoraServiceOptions = {
  apiKey?: string;
  signerPrivateKey?: string;
  chainId?: number;
  rpcUrl?: string;
  platformReferrer?: string; // developer / platform address for referral rewards
  traderReferrer?: string;   // optional, used on trade paths (not yet implemented here)
};

export type ContentCoinParams = {
  title: string;
  description: string;
  creatorAddress: string;
  metadataUri: string; // ipfs://<cid> for metadata JSON
  mediaUrl?: string;
  symbol?: string;
  currency?: 'CREATOR_COIN';
  startingMarketCap?: 'LOW';
};

export type CreatorCoinParams = {
  name: string;
  symbol: string;
  creatorAddress: string;
  metadataUri?: string;
};

export class ZoraService {
  private publicClient: any;
  private walletClient: any;
  private account: any;
  private chainId: number;
  private platformReferrer?: string;
  private traderReferrer?: string;

  constructor(options: ZoraServiceOptions) {
    const {
      apiKey,
      signerPrivateKey,
      chainId = base.id,
      rpcUrl = 'https://mainnet.base.org',
      platformReferrer,
      traderReferrer,
    } = options;

    this.chainId = chainId;
    this.platformReferrer = platformReferrer && isAddress(platformReferrer as `0x${string}`) ? platformReferrer : undefined;
    this.traderReferrer = traderReferrer && isAddress(traderReferrer as `0x${string}`) ? traderReferrer : undefined;

    // Set Zora API key if provided
    if (apiKey) {
      setApiKey(apiKey);
    }

    // Initialize chain configuration
    const chain = chainId === baseSepolia.id ? baseSepolia : base;

    // Create public client for reading blockchain data
    this.publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl)
    });

    // Create wallet client if private key is provided
    if (signerPrivateKey) {
      try {
        const privateKey = signerPrivateKey.startsWith('0x') 
          ? signerPrivateKey 
          : `0x${signerPrivateKey}`;
        
        this.account = privateKeyToAccount(privateKey as `0x${string}`);
        this.walletClient = createWalletClient({
          account: this.account,
          chain,
          transport: http(rpcUrl)
        });
      } catch (error) {
        console.error('Failed to initialize Zora wallet client:', error);
        throw new Error('Invalid signer private key provided');
      }
    }
  }

  /**
   * Build a create coin call (no signing/sending). Returns { to, data, value, chainId }.
   * Used for client-side user-signed transactions.
   */
  async buildCreateCoinCall(params: {
    title: string;
    symbol?: string;
    description?: string;
    metadataUri: string;
    creatorAddress: string;
  }): Promise<{ to: `0x${string}`; data: `0x${string}`; value: `0x${string}`; chainId: number }>
  {
    const { title, symbol, description, metadataUri, creatorAddress } = params;

    // coins-sdk expects a call object similar to the one used in createCoin
    const callArgs: any = {
      creator: creatorAddress as Address,
      name: title,
      symbol: symbol || this.generateSymbol(title),
      // coins-sdk expects RAW_URI type explicitly per project docs
      metadata: { type: 'RAW_URI', uri: metadataUri },
      // Prefer ZORA currency for coins; align with current service chainId
      currency: 'ZORA',
      chainId: this.chainId,
      payoutRecipientOverride: creatorAddress as Address,
      platformReferrer: this.platformReferrer as Address | undefined,
    };

    // SDK returns an array of calls: [{ to, data, value: bigint }]
    const calls = await createCoinCall({ ...(callArgs as any), skipMetadataValidation: true } as any);
    if (!Array.isArray(calls) || calls.length === 0) {
      throw new Error('Failed to build create coin call');
    }

    const first = calls[0] as any;
    const to = first.to as `0x${string}`;
    const data = first.data as `0x${string}`;
    const valueBigInt: bigint = (first.value ?? 0n) as bigint;
    const value = (`0x${valueBigInt.toString(16)}`) as `0x${string}`;
    const chainId = Number(this.chainId);
    return { to, data, value, chainId };
  }

  /**
   * Create a content coin (post-level token) 
   * Every post becomes an instantly tradeable coin
   */
  async createContentCoin(params: ContentCoinParams) {
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized. Provide signerPrivateKey.');
    }

    const { title, description, creatorAddress, metadataUri, symbol, currency = 'ETH', startingMarketCap } = params;

    try {
      // Create the coin using Zora SDK
      const result = await createCoin({
        walletClient: this.walletClient,
        publicClient: this.publicClient,
        call: {
          creator: creatorAddress as Address,
          name: title,
          symbol: symbol || this.generateSymbol(title),
          metadata: { type: 'RAW_URI', uri: metadataUri } as any,
          currency: currency as any,
          chainId: this.chainId,
          payoutRecipientOverride: creatorAddress as Address,
          // If configured, attribute platform referral to developer/platform address
          platformReferrer: this.platformReferrer as Address | undefined,
          // startingMarketCap is optional; pass through when provided
          startingMarketCap: startingMarketCap as any,
        },
        options: {}
      });

      return {
        success: true,
        coinAddress: result.address,
        transactionHash: result.hash,
        metadataUri,
        creatorAddress,
      };
    } catch (error) {
      console.error('Failed to create content coin:', error);
      throw error;
    }
  }

  /**
   * Create a creator coin (profile-level token)
   * Each creator gets a single coin representing their brand
   */
  async createCreatorCoin(params: CreatorCoinParams) {
    if (!this.walletClient) {
      throw new Error('Wallet client not initialized. Provide signerPrivateKey.');
    }

    const { name, symbol, creatorAddress, metadataUri } = params;

    try {
      const result = await createCoin({
        walletClient: this.walletClient,
        publicClient: this.publicClient,
        call: {
          creator: creatorAddress as Address,
          name,
          symbol,
          metadata: { type: 'RAW_URI', uri: metadataUri || '' } as any,
          currency: 'ZORA' as const,
          chainId: this.chainId,
          payoutRecipientOverride: creatorAddress as Address,
        },
        options: {}
      });

      return {
        success: true,
        coinAddress: result.address,
        transactionHash: result.hash,
        creatorAddress,
      };
    } catch (error) {
      console.error('Failed to create creator coin:', error);
      throw error;
    }
  }

  /**
   * Get profile information and coins for an address
   */
  async getProfileInfo(address: string) {
    try {
      const [profileResp, coinsResp] = (await Promise.all([
        getProfile({ identifier: address }),
        getProfileCoins({ identifier: address, count: 10 })
      ])) as any;

      const profile = (profileResp?.data?.profile || profileResp?.profile) as any;
      const createdCoins = (coinsResp?.data?.profile?.createdCoins || coinsResp?.profile?.createdCoins) as any;
      const coinsEdges = createdCoins?.edges || [];
      
      const coins = coinsEdges.map((edge: any) => ({
        name: edge?.node?.name,
        address: edge?.node?.address,
        symbol: edge?.node?.symbol,
        totalSupply: edge?.node?.totalSupply,
        createdAt: edge?.node?.createdAt,
      }));

      return {
        address,
        name: profile?.displayName || profile?.username || profile?.handle || address,
        avatar: profile?.avatar?.small || profile?.avatar?.medium,
        bio: profile?.bio,
        coins,
        totalCoins: coins.length,
      };
    } catch (error) {
      console.error('Failed to get profile info:', error);
      throw error;
    }
  }

  /**
   * Generate a symbol from the title (max 6 characters, uppercase)
   */
  private generateSymbol(title: string): string {
    // Remove special characters and spaces, take first 6 chars
    return title
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 6)
      .toUpperCase() || 'COIN';
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!(this.publicClient && this.walletClient && this.account);
  }

  /**
   * Get the configured wallet address
   */
  getWalletAddress(): string | null {
    return this.account?.address || null;
  }

  /** Get configured referral addresses (sanitized) */
  getReferralConfig() {
    return {
      platformReferrer: this.platformReferrer || null,
      traderReferrer: this.traderReferrer || null,
    };
  }
}

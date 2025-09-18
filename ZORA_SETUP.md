# Zora Integration Setup Guide

## Overview

This guide helps you set up the Zora coins integration with your Neynar Farcaster backend. The integration allows users to create tradeable cryptocurrency tokens from their social media content.

## What You'll Be Able to Do

- ✅ Connect Farcaster accounts with their Ethereum wallets
- ✅ Create content coins (post-level tokens) from media content  
- ✅ Schedule coin launches for future dates
- ✅ View user's Zora profile and existing coins
- ✅ Immediate coin creation with "Create Now" functionality

## Prerequisites

1. **Neynar Account & API Key**: Get from [Neynar Dashboard](https://dev.neynar.com)
2. **Zora API Key**: Get from [Zora Developer Portal](https://zora.co)
3. **Ethereum Wallet**: A private key for the wallet that will deploy coins
4. **Base Network Access**: Coins are deployed on Base (Ethereum L2)
5. **Optional: Pinata Account**: For IPFS media storage

## Step-by-Step Setup

### 1. Environment Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
```bash
# Neynar (Required)
NEYNAR_API_KEY=neynar_api_...          # From Neynar dashboard
NEYNAR_CLIENT_ID=your_client_id        # From Neynar dashboard

# Zora (Required for coin creation)
ZORA_API_KEY=your_zora_api_key         # From Zora developer portal
ZORA_SIGNER_PRIVATE_KEY=0x...          # Your Ethereum private key (has Base ETH)

# Pinata (Optional - for media uploads)
PINATA_JWT=your_pinata_jwt             # From Pinata dashboard
PINATA_GATEWAY_DOMAIN=gateway.pinata.cloud
```

### 2. Get Your API Keys

#### Neynar Setup
1. Go to [Neynar Dashboard](https://dev.neynar.com)
2. Create an account and verify your email
3. Create a new application
4. Get your `NEYNAR_API_KEY` and `NEYNAR_CLIENT_ID`
5. Add your domain to "Authorized Origins" for SIWN

#### Zora Setup  
1. Go to [Zora Developer Portal](https://zora.co)
2. Create an account
3. Request API access (may require approval)
4. Get your `ZORA_API_KEY`
5. Optional: Set up referral rewards — add your developer/platform address as `ZORA_PLATFORM_REFERRER` to receive protocol referral rewards on coin creation. See Zora docs: earning referral rewards.

#### Ethereum Wallet Setup
1. **Create a new wallet** (don't use your main wallet)
2. **Fund it with Base ETH** (~$20-50 for gas fees)
3. **Export the private key**
4. **Add to `.env` as `ZORA_SIGNER_PRIVATE_KEY`**

⚠️ **Security Warning**: Never commit private keys to version control!

### 3. Install Dependencies & Run

```bash
npm install
npm run dev
```

Navigate to `http://localhost:3000/app.html`

### 4. Test the Integration

1. **Sign In**: Click "Sign In with Neynar" 
2. **Check Wallet**: Look for wallet connection status
3. **Switch to Zora Mode**: Toggle the "Zora Coin" option
4. **Upload Media**: Upload an image or video
5. **Fill Coin Details**: 
   - Title: Name of your coin
   - Caption: Description  
   - Symbol: Optional 3-6 character ticker
6. **Create Coin**: Click "Create Coin Now"

## How It Works

### Farcaster → Ethereum Address Resolution

The system resolves Farcaster accounts to Ethereum addresses using this priority:
1. **Verified addresses** (user has verified ownership)
2. **Custody address** (default Farcaster wallet)

### Coin Creation Process

1. **Content Coin Creation**: Each post becomes a tradeable token
2. **Metadata Upload**: Media and details uploaded to IPFS
3. **Smart Contract Deploy**: Coin contract deployed on Base
4. **Automatic Trading**: Token immediately available on Uniswap V4

### Referral Rewards (Developer/Platform)

- This integration passes `platformReferrer` to Zora’s `createCoin` call when `ZORA_PLATFORM_REFERRER` is set. This attributes protocol referral rewards to your developer/platform address, per Zora’s referral program.
- To enable:
  - Set `ZORA_PLATFORM_REFERRER=0xYourAddress` in `.env`
  - Restart the server; startup logs will display the configured referrer.
- Future: `ZORA_TRADER_REFERRER` is reserved for trade operations when/if trading endpoints are added.

### Token Economics

- **Total Supply**: 1 billion tokens
- **Creator Allocation**: 10M tokens (instant)
- **Tradeable Supply**: 990M tokens (immediate market)
- **Trading Fees**: Distributed to creator, referrers, protocol
- **Liquidity**: 33% of fees locked as permanent pool depth

## API Endpoints

### Zora-Specific Routes

```bash
# Get user's Zora profile and existing coins
GET /zora/profile?fid=1234

# Create coin immediately  
POST /zora/coins/create
{
  "title": "My Amazing Post",
  "caption": "This is a revolutionary idea",
  "symbol": "AMAZING",
  "mediaUrl": "https://...",
}

# Schedule coin for future creation
POST /zora/coins/schedule  
{
  "title": "My Amazing Post",
  "caption": "This is a revolutionary idea", 
  "mediaUrl": "https://...",
  "when": "2024-01-01T12:00:00Z"
}

# Get scheduled coins queue
GET /zora/coins/queue

# Check wallet connection
GET /auth/wallet
```

## Troubleshooting

### Common Issues

**"Zora service not configured"**
- Check `ZORA_API_KEY` and `ZORA_SIGNER_PRIVATE_KEY` in `.env`
- Ensure wallet has Base ETH for gas

**"No wallet address found"**  
- User needs to verify an Ethereum address on Farcaster
- Or user needs to connect their custody wallet

**"Creator wallet address required"**
- The Farcaster account isn't linked to any Ethereum address
- User should verify an address via Farcaster client

**Transaction fails**
- Insufficient Base ETH for gas fees
- Network congestion (try again later)  
- Invalid metadata URI

### Debug Commands

```bash
# Check Zora configuration
curl http://localhost:3000/zora/profile?fid=1234

# Check wallet resolution
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/auth/wallet

# View server logs
npm run dev  # Watch console output
```

## Security Best Practices

1. **Separate Wallets**: Use dedicated wallet for coin deployment
2. **Environment Files**: Never commit `.env` to git
3. **API Key Security**: Rotate keys regularly
4. **Rate Limiting**: Monitor API usage
5. **Wallet Monitoring**: Track deployment costs

## Cost Estimation

### Typical Costs (Base Network)
- **Coin Deployment**: ~$0.50-2.00 per coin
- **API Calls**: Free tier limits apply
- **IPFS Storage**: ~$0.01-0.10 per media file

### Scaling Considerations
- Budget ~$100-500/month for 1000+ coins
- Consider gasless options for high volume
- Monitor Base network fee fluctuations

## Advanced Configuration

### Custom RPC Endpoint
```bash
ZORA_RPC_URL=https://your-custom-base-rpc.com
```

### Testnet Development
```bash
ZORA_CHAIN_ID=84532  # Base Sepolia testnet
ZORA_RPC_URL=https://sepolia.base.org
```

### Custom Pinata Gateway
```bash
PINATA_GATEWAY_DOMAIN=your-custom-gateway.mypinata.cloud
```

## Support

- **Neynar Issues**: [Neynar Discord](https://discord.gg/neynar)
- **Zora Issues**: [Zora Discord](https://discord.gg/zora)  
- **Base Network**: [Base Discord](https://discord.gg/base)
- **Code Issues**: Check GitHub issues or create new ones

## Next Steps

1. **Test on Testnet**: Use Base Sepolia for development
2. **Custom UI**: Build your own interface using the APIs
3. **Bulk Operations**: Create multiple coins programmatically
4. **Analytics**: Track coin performance and trading volume
5. **Mobile Support**: Test on mobile Farcaster clients

The Zora integration is now ready! Users can create tradeable tokens from their Farcaster content with just a few clicks.

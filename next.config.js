/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    return config
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.walletconnect.com https://*.walletconnect.org https://*.reown.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.reown.com",
              "font-src 'self' https://fonts.gstatic.com https://fonts.reown.com",
              "img-src 'self' data: blob: https://*.walletconnect.com https://*.walletconnect.org https://*.reown.com https://api.web3modal.org",
              "connect-src 'self' https://*.walletconnect.com https://*.walletconnect.org https://*.reown.com https://api.web3modal.org https://pulse.walletconnect.org https://rpc.walletconnect.org wss://*.walletconnect.com wss://*.walletconnect.org wss://*.reown.com https://*.infura.io https://*.alchemy.com https://pay.walletconnect.com https://keys.coinbase.com https://*.thirdweb.com",
              "frame-src 'self' https://*.walletconnect.com https://*.walletconnect.org https://*.reown.com https://secure.walletconnect.org https://secure-mobile.walletconnect.com https://secure-mobile.walletconnect.org",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
module.exports = nextConfig;

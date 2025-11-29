/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === 'production' ? "export" : undefined,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ipfs.io",
        pathname: "/ipfs/**",
      },
      {
        protocol: "https",
        hostname: "*.nftstorage.link",
      },
    ],
  },
  trailingSlash: true,
  allowedDevOrigins: [
    "*.sisko.replit.dev",
    "*.replit.dev",
    "*.repl.co",
    "localhost:5000",
  ],
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: '2mb' }
  },
  typescript: {
    tsconfigPath: './tsconfig.json'
  }
}

export default nextConfig


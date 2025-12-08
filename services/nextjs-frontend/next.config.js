/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Убираем standalone для упрощения
  // output: 'standalone',
}

module.exports = nextConfig


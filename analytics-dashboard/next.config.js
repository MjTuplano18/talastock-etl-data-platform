/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow ngrok and any other tunnel URLs to access the app
  allowedDevHosts: [
    '.ngrok-free.app',
    '.ngrok.io',
  ],
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable filesystem cache in dev to prevent memory allocation failures
      config.cache = false
    }
    return config
  },
}
module.exports = nextConfig

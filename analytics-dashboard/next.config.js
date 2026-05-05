/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable filesystem cache in dev to prevent memory allocation failures
      config.cache = false
    }
    return config
  },
}
module.exports = nextConfig

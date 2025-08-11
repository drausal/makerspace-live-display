/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@vercel/kv'],
  env: {
    CALENDAR_ID: process.env.CALENDAR_ID,
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD
  }
};

module.exports = nextConfig;

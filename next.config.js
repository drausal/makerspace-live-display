/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    CALENDAR_ID: process.env.CALENDAR_ID,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD
  }
};

module.exports = nextConfig;

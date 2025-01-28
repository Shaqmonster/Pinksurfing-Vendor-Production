// next.config.js
const nextConfig = {
  images: {
    domains: ['pinksurfing.s3.eu-central-1.amazonaws.com','pinksurfing-ecom.s3.us-east-2.amazonaws.com'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;

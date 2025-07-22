// next.config.mjs
import withPWA from 'next-pwa';

const nextConfig = {
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development",
};

export default withPWA(nextConfig);
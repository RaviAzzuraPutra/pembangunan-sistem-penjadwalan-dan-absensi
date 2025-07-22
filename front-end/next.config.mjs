// next.config.mjs
import withPWA from 'next-pwa';

const nextConfig = {
    dest: 'public',
    register: true,
    skipWaiting: true,
};

export default withPWA(nextConfig);
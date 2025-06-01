import withPWA from 'next-pwa';

const nextConfig = {
};

export default withPWA({
    ...nextConfig,
    dest: "public",
    register: true,
    skipWaiting: true,
    swSrc: 'src/sw-custom.js',
});

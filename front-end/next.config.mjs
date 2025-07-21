import withPWA from 'next-pwa';

const nextConfig = {
    reactStrictMode: true,
};

export default withPWA({
    dest: "public",
    register: true,
    skipWaiting: true,
    swSrc: 'src/sw.js',
})(nextConfig);

import withPWA from 'next-pwa';

const nextConfig = {
    reactStrictMode: true,
};

export default withPWA({
    dest: "public",
    register: true,
    disable: process.env.NODE_ENV === "development",
    skipWaiting: true,
    swSrc: 'src/sw.js',
})(nextConfig);

import withPWA from 'next-pwa';

const nextConfig = {
    reactStrictMode: true,
};

export default withPWA({
    dest: "public", // ✅ HARUS di sini, bukan di dalam `nextConfig`
    register: true,
    skipWaiting: true,
    swSrc: 'src/sw-custom.js',
})(nextConfig);

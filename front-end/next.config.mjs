import withPWA from "next-pwa";


const nextConfig = {
    reactStrictMode: true,
    webpack: (config) => {
        // Tambahkan fallback untuk menghindari error 'fs' di client
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
        };
        return config;
    },
};

export default withPWA({
    dest: "public",
    skipWaiting: true,
    clientsClaim: true,
    register: true,
})(nextConfig);

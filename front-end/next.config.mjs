import withPWA from "next-pwa";


const nextConfig = {
    reactStrictMode: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    webpack: (config) => {
        config.resolve.fallback = { ...config.resolve.fallback, fs: false };
        return config;
    },
};

export default withPWA({
    dest: "public",
    skipWaiting: true,
    clientsClaim: true,
    register: true,
})(nextConfig);

import withPWA from "next-pwa";

const nextConfig = {
    reactStrictMode: true,
};

export default isProd
    ? withPWA({
        dest: "public",
        skipWaiting: true,
        clientsClaim: true,
        swSrc: "src/sw-custom.js",
    })(nextConfig)
    : nextConfig;
import withPWA from "next-pwa";

const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
    reactStrictMode: true,
};

export default isProd
    ? withPWA({
        dest: "public",
        register: true,
        skipWaiting: true,
        disable: !isProd,
        clientsClaim: true,
        swSrc: "src/sw-custom.js",
    })(nextConfig)
    : nextConfig;
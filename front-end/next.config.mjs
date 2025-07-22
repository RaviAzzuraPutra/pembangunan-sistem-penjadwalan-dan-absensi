import withPWA from "next-pwa";

const nextConfig = {
    reactStrictMode: true,
};

export default withPWA({
    dest: "public",
    skipWaiting: true,
    clientsClaim: true,
    swSrc: "public/sw-custom.js",
    register: true,
})(nextConfig);

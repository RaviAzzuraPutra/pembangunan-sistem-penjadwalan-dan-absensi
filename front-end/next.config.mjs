import withPWA from "next-pwa";

const nextConfig = {
    reactStrictMode: true,
    experimental: {
        appDir: true, // ini penting untuk folder `app/`
    },
};

export default withPWA({
    dest: "public",
    skipWaiting: true,
    clientsClaim: true,
    swSrc: "src/sw-custom.js",
    register: true,
})(nextConfig);

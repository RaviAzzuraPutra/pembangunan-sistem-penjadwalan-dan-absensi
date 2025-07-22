import withPWA from "next-pwa";

const isProd = process.env.NODE_ENV === "production";

export default withPWA({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: !isProd,
    clientsClaim: true,
    swSrc: "src/sw-custom.js",
    buildExcludes: [],
})({
    reactStrictMode: true,
});

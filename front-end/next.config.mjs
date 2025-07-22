import withPWA from "next-pwa";

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

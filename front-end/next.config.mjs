import withPWA from "next-pwa";

const nextConfig = {
    reactStrictMode: true,
};

export default withPWA({
    dest: "public",
    skipWaiting: true,
    clientsClaim: true,
    register: true,
})(nextConfig);

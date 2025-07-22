import withPWA from "next-pwa";

export default withPWA({
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === "development",
    mode: "production", // ⬅️ penting untuk forcing generation
})({
    reactStrictMode: true,
});

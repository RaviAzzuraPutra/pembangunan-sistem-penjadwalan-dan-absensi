const withPWA = require('next-pwa')({
    dest: 'public'
})

const nextConfig = {
    /* config options here */
};

export default withPWA(nextConfig);

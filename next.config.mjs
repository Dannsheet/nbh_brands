/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'luoneibyfgibvchinsll.supabase.co',
            },
            {
                protocol: 'https',
                hostname: 'bwychvsydhqtjkntqkta.supabase.co',
            },
        ],
    },
    async redirects() {
        return [
          {
            source: '/register',
            destination: '/registro',
            permanent: true,
          },
        ]
      },
};

export default nextConfig;

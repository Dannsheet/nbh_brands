/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['luoneibyfgibvchinsll.supabase.co', 'bwychvsydhqtjkntqkta.supabase.co'],
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

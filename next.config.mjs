/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true, // ⚠️ fuerza a no usar el optimizador de Vercel
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

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        unoptimized: true, // ⚠️ Desactiva el optimizador de Vercel para evitar el error 402
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

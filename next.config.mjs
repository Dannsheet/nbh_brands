/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        deviceSizes: [640, 1080], // solo 2 tamaños para responsive
        imageSizes: [16, 32, 64], // solo para íconos o miniaturas
        formats: ['image/avif', 'image/webp'], // optimiza en formatos modernos
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

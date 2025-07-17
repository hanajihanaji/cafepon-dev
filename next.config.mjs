/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/hakosbells-4thanniversary',
        destination: '/hakos-baelz-4thanniversary',
        permanent: true,
      },
      {
        source: '/hakosbells-4thanniversary/:path*',
        destination: '/hakos-baelz-4thanniversary/:path*',
        permanent: true,
      },
    ]
  },
}

export default nextConfig

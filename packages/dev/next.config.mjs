import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: "imagedelivery.net",
      },
    ],
  },
  // Your Next.js config here
}

export default withPayload(nextConfig)

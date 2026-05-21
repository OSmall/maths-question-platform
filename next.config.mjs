import { withPayload } from '@payloadcms/next/withPayload'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url)
await jiti.import('./src/env.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your Next.js config here
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })

// storage-adapter-import-placeholder
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'

import { cloudflareStorage } from '../../../dist'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    cloudflareStorage({
      enabled: !!process.env.CLOUDFLARE_API_KEY,
      collections: {
        [Media.slug]: {
          disablePayloadAccessControl: true,
        },
      },
      apiKey: process.env.CLOUDFLARE_API_KEY as string,
      accountHash: process.env.CLOUDFLARE_ACCOUNT_HASH as string,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID as string,
    }),

    // storage-adapter-placeholder
  ],
})

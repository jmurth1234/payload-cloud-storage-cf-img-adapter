import { buildConfig } from 'payload/config'
import path from 'path'
import Users from './collections/Users'
import Examples from './collections/Examples'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { webpackBundler } from '@payloadcms/bundler-webpack'
import { slateEditor } from '@payloadcms/richtext-slate'
import { cloudStorage } from '@payloadcms/plugin-cloud-storage'

// @ts-ignore - this is a dev dependency
import { cloudflareAdapter, cloudStorageStrict } from '../../src/index'

export default buildConfig({
  admin: {
    user: Users.slug,
    bundler: webpackBundler(),
    webpack: config => {
      const newConfig = {
        ...config,
        resolve: {
          ...config.resolve,
          alias: {
            ...(config?.resolve?.alias || {}),
            react: path.join(__dirname, '../node_modules/react'),
            'react-dom': path.join(__dirname, '../node_modules/react-dom'),
            payload: path.join(__dirname, '../node_modules/payload'),
          },
        },
      }
      return newConfig
    },
  },
  editor: slateEditor({}),
  collections: [Examples, Users],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },
  plugins: [
    // @ts-ignore - this is a dev dependency
    cloudStorageStrict({
      errorField: 'uploadError',
      enabled: !!process.env.CLOUDFLARE_API_KEY,
      collections: {
        [Examples.slug]: {
          disablePayloadAccessControl: true,
          adapter: cloudflareAdapter({
            apiKey: process.env.CLOUDFLARE_API_KEY as string,
            accountHash: process.env.CLOUDFLARE_ACCOUNT_HASH as string,
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID as string,
          }),
        },
      },
    }),
  ],
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
})

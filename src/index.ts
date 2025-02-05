import type {
  Adapter,
  PluginOptions as CloudStoragePluginOptions,
  CollectionOptions,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import type { Config, Plugin, UploadCollectionSlug } from 'payload'

import { getGenerateURL } from './generateURL.js'
import { getHandleDelete } from './handleDelete.js'
import { getHandleUpload } from './handleUpload.js'
import { getHandler } from './staticHandler.js'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'

export type Args = {
  /**
   * The base URL to serve images from. Defaults to https://imagedelivery.net/
   */
  baseUrl?: string

  /**
   * The API key for the Cloudflare account. This needs access to the Images API.
   */
  apiKey: string

  /**
   * The account hash for the Cloudflare account. This is the first part of the URL 
   * when accessing the images.
   */
  accountHash: string

  /**
   * The account ID for the Cloudflare account. This is used for API calls to 
   * upload and delete images.
   */
  accountId: string

  /**
   * Whether the Cloudflare storage adapter is enabled.
   */
  enabled?: boolean

  /**
   * Collection options to apply the Cloudflare adapter to.
   */
  collections?: Partial<Record<UploadCollectionSlug, Omit<CollectionOptions, 'adapter'> | true>>
}

type CloudStoragePlugin = (storageArgs: Args) => Plugin


export const cloudflareStorage: CloudStoragePlugin =
  (args: Args) =>
  (incomingConfig: Config): Config => {
    if (args.enabled === false) {
      return incomingConfig
    }

    if (!args.collections) {
      throw new Error('Collections are required for the Cloudflare storage adapter.')
    }

    const adapter = cloudflareAdapter(args)

    // Add adapter to each collection option object
    const collectionsWithAdapter: CloudStoragePluginOptions['collections'] = Object.entries(
      args.collections,
    ).reduce(
      (acc, [slug, collOptions]) => ({
        ...acc,
        [slug]: {
          ...(collOptions === true ? {} : collOptions),
          adapter,
        },
      }),
      {} as Record<string, CollectionOptions>,
    )

    // Set disableLocalStorage: true for collections specified in the plugin options
    const config = {
      ...incomingConfig,
      collections: (incomingConfig.collections || []).map((collection) => {
        if (!collectionsWithAdapter[collection.slug]) {
          return collection
        }

        return {
          ...collection,
          upload: {
            ...(typeof collection.upload === 'object' ? collection.upload : {}),
            disableLocalStorage: true,
          },
        }
      }),
    }

    return cloudStoragePlugin({
      collections: collectionsWithAdapter as Partial<Record<UploadCollectionSlug, CollectionOptions>>,
    })(config)
  }


export const cloudflareAdapter =
  ({
    apiKey,
    accountHash,
    accountId,
    baseUrl = 'https://imagedelivery.net',
  }: Args): Adapter =>
  ({ collection, prefix }): GeneratedAdapter => {
    return {
      name: 'cloudflare',
      generateURL: getGenerateURL({ apiKey, accountHash, baseUrl, accountId }),
      handleDelete: getHandleDelete({ apiKey, accountHash, accountId }),
      handleUpload: getHandleUpload({
        prefix,
        apiKey,
        accountHash,
        accountId
      }),
      staticHandler: getHandler({ apiKey, accountHash, collection, baseUrl, accountId }),
    }
  }

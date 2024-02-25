import {
  Adapter,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/dist/types'

import { getGenerateURL } from './generateURL'
import { getHandleDelete } from './handleDelete'
import { getHandleUpload } from './handleUpload'
import { getHandler } from './staticHandler'
import { extendWebpackConfig } from './webpack'

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
      generateURL: getGenerateURL({ apiKey, accountHash, baseUrl, accountId }),
      handleDelete: getHandleDelete({ apiKey, accountHash, accountId }),
      handleUpload: getHandleUpload({
        prefix,
        apiKey,
        accountHash,
        accountId
      }),
      staticHandler: getHandler({ apiKey, accountHash, collection, baseUrl, accountId }),
      webpack: extendWebpackConfig,
    }
  }

import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/types'
import { Args } from './index.js'
import { getFilename } from './generateURL.js'

export const getHandleDelete = ({
  apiKey,
  accountId,
}: Args): HandleDelete => {
  return async ({ doc: { prefix = '' }, filename }) => {
    const fileKey = getFilename({ filename, prefix })

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${fileKey}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    )

    const res = await response.json()

    if (response.status !== 200 || !res.success) {
      if (res.errors) {
        // don't throw if the image doesn't exist
        if (res.errors[0].message.includes('not found')) {
          return
        }

        throw new Error(`Failed to delete image: ${res.errors[0].message}`)
      }

      throw new Error('Failed to delete image')
    }
  }
}

import type { HandleDelete } from '@payloadcms/plugin-cloud-storage/dist/types'
import { Args } from '.'
import { getFilename } from './generateURL'

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

    if (response.status !== 200) {
      throw new Error('Failed to delete image')
    }
  }
}

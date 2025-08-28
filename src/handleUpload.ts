import type stream from 'stream'

import fs from 'fs'
import FormData from 'form-data'
import fetch from 'node-fetch'

import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/dist/types'
import { Args } from '.'
import { getFilename } from './generateURL'
import { throwValidation } from './errors/throwValidation'

// Use shared throwValidation helper

interface UploadArgs extends Args {
  prefix?: string
}

export const getHandleUpload = ({
  apiKey,
  accountId,
  prefix = '',
}: UploadArgs): HandleUpload => {
  return async ({ data, file }) => {
    const fileKey = getFilename({ filename: file.filename, prefix })

    const fileBufferOrStream: Buffer | stream.Readable = file.tempFilePath
      ? fs.createReadStream(file.tempFilePath)
      : file.buffer

    const formData = new FormData()
    formData.append('file', fileBufferOrStream)
    formData.append('id', fileKey)

    const response = await fetch(
      'https://api.cloudflare.com/client/v4/accounts/' +
        accountId +
        '/images/v1',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + apiKey,
        },
        body: formData,
      }
    )

    let res: any
    try {
      res = await response.json()
    } catch (e) {
      const message = `Failed to upload image: Unexpected response (${response.status} ${response.statusText})`
      throwValidation({ message })
    }

    if (response.status !== 200 || !res?.success) {
      let message: string | undefined
      if (res?.errors && Array.isArray(res.errors) && res.errors.length > 0) {
        message = res.errors[0]?.message || 'Unknown error'
      } else if (typeof res?.error === 'string') {
        message = res.error
      } else if (typeof res?.messages?.[0] === 'string') {
        message = res.messages[0]
      } else {
        message = `Unexpected response (${response.status} ${response.statusText})`
      }

      throwValidation({ message: `Failed to upload image: ${message}` })
    }

    return data
  }
}

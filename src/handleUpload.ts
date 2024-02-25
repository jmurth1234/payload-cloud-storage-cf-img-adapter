import type stream from 'stream'

import fs from 'fs'
import FormData from 'form-data'
import fetch from 'node-fetch'

import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/dist/types'
import { Args } from '.'
import { getFilename } from './generateURL'

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

    const res = await response.json()

    if (response.status !== 200 || !res.success) {
      if (res.errors) {
        throw new Error(`Failed to upload image: ${res.errors[0].message}`)
      }

      throw new Error('Failed to upload image')
    }

    return data
  }
}

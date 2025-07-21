import type stream from 'stream'

import fs from 'fs'
import FormData from 'form-data'
import fetch from 'node-fetch'

import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'
import { Args } from './index.js'
import { getFilename, addTimestampToFilename } from './generateURL.js'

interface UploadArgs extends Args {
  prefix?: string
}

export const getHandleUpload = ({
  apiKey,
  accountId,
  prefix = '',
}: UploadArgs): HandleUpload => {
  return async ({ data, file }) => {
    // Add timestamp to filename before extension
    const uniqueFilename = addTimestampToFilename(file.filename)
    
    const fileKey = getFilename({ filename: uniqueFilename, prefix })

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

    // Update the filename in data to match the uploaded filename
    data.filename = uniqueFilename
  }
}

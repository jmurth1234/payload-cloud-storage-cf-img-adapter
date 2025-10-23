import type stream from 'stream'

import fs from 'fs'
import FormData from 'form-data'
import fetch from 'node-fetch'

import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/types'
import { Args } from './index.js'
import { getFilename, addTimestampToFilename } from './generateURL.js'
import type { CloudflareAdapterArgs } from './index.js'
import { throwValidation } from './errors/throwValidation.js'

interface UploadArgs extends CloudflareAdapterArgs {
  prefix?: string
}

interface CloudflareUploadResponse {
  success: boolean
  errors?: Array<{ message: string }>
  result?: {
    id: string
    filename: string
    uploaded: string
    requireSignedURLs: boolean
    variants: string[]
  }
}

export const getHandleUpload = ({
  apiKey,
  accountId,
  prefix = '',
}: UploadArgs): HandleUpload => {
  return async ({ data, file, req }) => {
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

    let res: any
    try {
      res = await response.text()
      res = JSON.parse(res) as CloudflareUploadResponse
    } catch (error) {
      const message = `Failed to upload image: Unexpected response (${response.status} ${response.statusText})`

      throwValidation({ req, message })
    }

    if (response.status !== 200 || !res?.success) {
      let message: string | undefined
      if (Array.isArray(res?.errors) && res.errors.length > 0) {
        message = res.errors[0]?.message || 'Unknown error'
      } else if (typeof res?.error === 'string') {
        message = res.error
      } else if (Array.isArray(res?.messages) && res.messages.length > 0) {
        message = res.messages[0]
      }

      throwValidation({
        req,
        message: `Failed to upload image: ${message || `Unexpected response (${response.status} ${response.statusText})`}`,
      })
    }

    // Update the filename in data to match the uploaded filename
    data.filename = uniqueFilename
  }
}

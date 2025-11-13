import type stream from 'stream'

import fs from 'fs'
import FormData from 'form-data'
import fetch from 'node-fetch'

import type { HandleUpload } from '@payloadcms/plugin-cloud-storage/dist/types'
import { Args } from '.'
import { addTimestampToFilename, getFilename } from './generateURL'
import { throwValidation } from './errors/throwValidation'

interface UploadArgs extends Args {
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
  messages?: string[]
  error?: string
}

export const getHandleUpload = ({
  apiKey,
  accountId,
  prefix = '',
}: UploadArgs): HandleUpload => {
  return async ({ data, file, req }) => {
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

    let res: CloudflareUploadResponse | undefined
    try {
      const responseText = await response.text()
      res = JSON.parse(responseText) as CloudflareUploadResponse
    } catch (e) {
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
        message: `Failed to upload image: ${
          message || `Unexpected response (${response.status} ${response.statusText})`
        }`,
      })
    }

    // Check if this is a crop or the main file
    // First check if this is a crop to handle edge case where crops are uploaded before main file
    let isCrop = false
    if (data.sizes) {
      for (const key of Object.keys(data.sizes)) {
        if (data.sizes[key]?.filename === file.filename) {
          data.sizes[key].filename = uniqueFilename
          isCrop = true
          break
        }
      }
    }

    // If not a crop, update main filename
    if (!isCrop) {
      data.filename = uniqueFilename
    }

    return data
  }
}

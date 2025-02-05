import type { CollectionConfig } from 'payload'

import fetch from 'node-fetch'

import { StaticHandler } from '@payloadcms/plugin-cloud-storage/types'
import { getFilePrefix } from '@payloadcms/plugin-cloud-storage/utilities'

import { Args } from './index.js'
import { getGenerateURL } from './generateURL.js'

interface StaticHandlerArgs extends Args {
  collection: CollectionConfig
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const streamToBuffer = async (readableStream: any) => {
  const chunks = []
  for await (const chunk of readableStream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export const getHandler = ({
  baseUrl,
  accountHash,
  accountId,
  collection,
  apiKey,
}: StaticHandlerArgs): StaticHandler => {
  const generateUrl = getGenerateURL({ accountHash, accountId, baseUrl, apiKey })
  const handler: StaticHandler = async (req, { params: { filename } }) => {
    try {
      const prefix = await getFilePrefix({ collection, filename, req })
      const file = await generateUrl({
        collection,
        data: {},
        filename,
        prefix,
      })

      const accept = req.headers.get('accept')

      const response = await fetch(file, {
        headers: {
          // pass supported formats from request
          Accept: accept || 'image/png',
        },
      })

      if (response.status !== 200) {
        return new Response(null, { status: 404 })
      }

      const buffer = await streamToBuffer(response.body)

      return new Response(buffer, {
        status: 200,
        headers: new Headers({
          'Content-Type': response.headers.get('content-type') || 'application/octet-stream',
          'Cache-Control': response.headers.get('cache-control') || 'public, max-age=31536000, immutable',
        }),
      })
    } catch (err: unknown) {
      req.payload.logger.error(err)
      return new Response(null, { status: 404 })
    }
  }

  return handler
}

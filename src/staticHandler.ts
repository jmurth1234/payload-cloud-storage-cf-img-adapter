import type { CollectionConfig } from 'payload/types'

import fetch from 'node-fetch'

import { StaticHandler } from '@payloadcms/plugin-cloud-storage/dist/types'
import { getFilePrefix } from '@payloadcms/plugin-cloud-storage/dist/utilities/getFilePrefix'

import { Args } from '.'
import { getGenerateURL } from './generateURL'

interface StaticHandlerArgs extends Args {
  collection: CollectionConfig
}

export const getHandler = ({
  baseUrl,
  accountHash,
  accountId,
  collection,
  apiKey,
}: StaticHandlerArgs): StaticHandler => {
  const generateUrl = getGenerateURL({ accountHash, accountId, baseUrl, apiKey })
  return async (req, res, next) => {
    try {
      const prefix = await getFilePrefix({ collection, req })
      const file = await generateUrl({
        filename: req.params.filename,
        prefix,
        collection,
      })

      const response = await fetch(file, {
        headers: {
          // pass supported formats from request
          Accept: (req.headers['accept'] as string) || 'image/png',
        },
      })

      if (response.status !== 200) {
        return next()
      }

      res.setHeader(
        'Content-Type',
        response.headers.get('content-type') || 'application/octet-stream'
      )

      res.setHeader(
        'Cache-Control',
        response.headers.get('cache-control') ||
          'public, max-age=31536000, immutable'
      )

      res.status(200)

      return response.body.pipe(res)
    } catch (err: unknown) {
      req.payload.logger.error(err)
      return next()
    }
  }
}

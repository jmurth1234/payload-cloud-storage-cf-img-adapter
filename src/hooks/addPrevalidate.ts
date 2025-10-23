import { createRequire } from 'node:module'

import { throwValidation } from '../errors/throwValidation.js'

const require = createRequire(import.meta.url)

// eslint-disable-next-line @typescript-eslint/no-var-requires
const imageSize = require('image-size') as (input: Buffer) => { width?: number; height?: number; type?: string }

type PluginOptions = {
  errorField?: string
}

export function addPrevalidateHook(existing: any, pluginOptions: PluginOptions): any[] {
  const hooks: any[] = [...((existing?.beforeValidate as any[]) || [])]

  hooks.push(async ({ data, req }: any) => {
    const file = (req as any)?.files?.file
    if (!file || !file.data) return data

    const MAX_DIMENSION = 12000
    const MAX_AREA = 100_000_000
    const MAX_BYTES = 10 * 1024 * 1024
    const ANIMATED_MAX_AREA = 50_000_000

    const mime = data?.mimeType || file?.mimetype
    const bytes = typeof file?.size === 'number' ? file.size : undefined
    const errorFieldName = pluginOptions?.errorField || 'uploadError'

    if (typeof bytes === 'number' && bytes > MAX_BYTES) {
      throwValidation({ req, field: 'file', message: 'Image exceeds 10MB limit (Cloudflare Images)' })
    }

    try {
      const dims = imageSize(file.data as Buffer)
      const width = dims?.width
      const height = dims?.height

      if (typeof width === 'number' && width > MAX_DIMENSION) {
        throwValidation({ req, field: 'file', message: 'Image width exceeds 12000px (Cloudflare Images)' })
      }

      if (typeof height === 'number' && height > MAX_DIMENSION) {
        throwValidation({ req, field: 'file', message: 'Image height exceeds 12000px (Cloudflare Images)' })
      }

      if (typeof width === 'number' && typeof height === 'number') {
        const area = width * height
        const isAnimatedType = typeof mime === 'string' && /gif|webp/i.test(mime)

        if (isAnimatedType) {
          if (area > ANIMATED_MAX_AREA) {
            throwValidation({ req, field: 'file', message: 'Animated GIF/WebP exceeds 50MP (Cloudflare Images)' })
          }
        } else if (area > MAX_AREA) {
          throwValidation({ req, field: 'file', message: 'Image exceeds 100MP area (Cloudflare Images)' })
        }
      }
    } catch (error) {
      // ignore probe errors
    }

    if (data && errorFieldName && data[errorFieldName]) {
      delete data[errorFieldName]
    }

    return data
  })

  return hooks
}


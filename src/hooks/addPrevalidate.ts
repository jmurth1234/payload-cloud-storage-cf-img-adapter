import { throwValidation } from '../errors/throwValidation'
// Lazy require to avoid type deps
// eslint-disable-next-line @typescript-eslint/no-var-requires
const imageSize = require('image-size') as (input: Buffer) => { width: number; height: number; type?: string }

export function addPrevalidateHook(existing: any, pluginOptions: any): any[] {
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
    const errorFieldName = (pluginOptions && (pluginOptions as any).errorField) || 'uploadError'
    const recordOrThrow = (message: string) => {
      throwValidation({ req, field: 'file', message })
    }

    if (typeof bytes === 'number' && bytes > MAX_BYTES) {
      recordOrThrow('Image exceeds 10MB limit (Cloudflare Images)')
    }

    try {
      const dims = imageSize(file.data as Buffer)
      const width = dims?.width
      const height = dims?.height
      if (typeof width === 'number' && width > MAX_DIMENSION) {
        recordOrThrow('Image width exceeds 12000px (Cloudflare Images)')
      }
      if (typeof height === 'number' && height > MAX_DIMENSION) {
        recordOrThrow('Image height exceeds 12000px (Cloudflare Images)')
      }
      if (typeof width === 'number' && typeof height === 'number') {
        const area = width * height
        const isAnimatedType = typeof mime === 'string' && /gif|webp/i.test(mime)
        if (isAnimatedType) {
          if (area > ANIMATED_MAX_AREA) {
            recordOrThrow('Animated GIF/WebP exceeds 50MP (Cloudflare Images)')
          }
        } else if (area > MAX_AREA) {
          recordOrThrow('Image exceeds 100MP area (Cloudflare Images)')
        }
      }
    } catch (e) {
      // ignore probe error
    }

    // Clear previous error if present and validations passed
    if (data && data[errorFieldName]) {
      delete data[errorFieldName]
    }

    return data
  })
  return hooks
}



import path from 'path'

import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/dist/types'
import type { Args } from '.'

export const generateTimestamp = (): string => {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  const ms = String(now.getMilliseconds()).padStart(3, '0')
  return `${yy}${mm}${dd}${hh}${mi}${ss}${ms}`
}

export const addTimestampToFilename = (filename: string): string => {
  const randomDigits = Math.floor(Math.random() * 10 ** 4)
    .toString()
    .padStart(4, '0')
  const uniqueSuffix = `${generateTimestamp()}${randomDigits}`
  const parsed = path.posix.parse(filename)
  const baseName = parsed.name || parsed.base
  const extension = parsed.ext ?? ''
  const timestampedBase = `${baseName}_${uniqueSuffix}${extension}`

  return parsed.dir
    ? path.posix.join(parsed.dir, timestampedBase)
    : timestampedBase
}

export const getGenerateURL =
  ({ accountHash, baseUrl }: Args): GenerateURL =>
  ({ filename, prefix = '' }) => {
    // TODO: Add support for non flexible variants.
    return `${baseUrl}/${accountHash}/${getFilename({ filename, prefix })}/format=auto`
  }

export const getFilename = ({
  filename,
  prefix = '',
}: {
  filename: string
  prefix?: string
}) => {
  return path.posix.join(prefix, filename)
}

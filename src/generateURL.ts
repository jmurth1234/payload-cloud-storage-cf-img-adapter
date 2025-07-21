import path from 'path'

import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/types'
import type { Args } from './index.js'

export const generateTimestamp = (): string => {
  return new Date().toISOString().replace(/[-:T]/g, '').slice(0, 10)
}

export const addTimestampToFilename = (filename: string): string => {
  const timestamp = generateTimestamp()
  const filenameParts = filename.split('.')
  const extension = filenameParts.pop()
  const baseName = filenameParts.join('.')
  return `${baseName}_${timestamp}.${extension}`
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

import path from 'path'

import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/types'
import type { Args } from './index.js'

export const generateTimestamp = (): string => {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')
  return `${yy}${mm}${dd}${hh}${ss}`
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

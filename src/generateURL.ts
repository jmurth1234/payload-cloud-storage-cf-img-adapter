import path from 'path'

import type { GenerateURL } from '@payloadcms/plugin-cloud-storage/dist/types'
import type { Args } from '.'

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

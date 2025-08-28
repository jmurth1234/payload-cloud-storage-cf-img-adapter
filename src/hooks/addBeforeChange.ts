import { getIncomingFiles } from '@payloadcms/plugin-cloud-storage/dist/utilities/getIncomingFiles'

type GeneratedAdapter = any
type FileData = any
type TypeWithID = any
type TypeWithPrefix = { prefix?: string }

export function getBeforeChangeHookStrict({
  adapter,
  collection,
  errorFieldName,
}: {
  adapter: GeneratedAdapter
  collection: any
  errorFieldName?: string
}) {
  return async ({ data, originalDoc, req }: any) => {
    // If prevalidate recorded an error (legacy record path), skip upload here
    if (typeof errorFieldName === 'string' && errorFieldName.length > 0 && data && (data as any)[errorFieldName]) {
      return data
    }
    const files = getIncomingFiles({ data, req })

    if (files.length > 0) {
      if (originalDoc) {
        let filesToDelete: string[] = []

        if (typeof (originalDoc as any)?.filename === 'string') {
          filesToDelete.push((originalDoc as any).filename)
        }

        if (typeof (originalDoc as any).sizes === 'object') {
          filesToDelete = filesToDelete.concat(
            Object.values((originalDoc as any)?.sizes || []).map(
              (resizedFileData: any) => (resizedFileData as any)?.filename
            )
          )
        }

        const deletionPromises = filesToDelete.map(async (filename: any) => {
          if (filename) {
            await adapter.handleDelete({
              collection,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              doc: originalDoc as unknown as TypeWithID & FileData & TypeWithPrefix,
              filename,
              req,
            })
          }
        })

        await Promise.all(deletionPromises)
      }

      const promises = files.map(async file => {
        try {
          await adapter.handleUpload({ collection, data, file, req })
        } catch (e: any) {
          if (data && typeof errorFieldName === 'string' && errorFieldName.length > 0) {
            const message = e?.message || 'Upload failed'
            ;(data as any)[errorFieldName] = message
          }
          throw e
        }
      })

      await Promise.all(promises)

      // success: clear any previous error
      const fld = typeof errorFieldName === 'string' ? errorFieldName : ''
      if (fld && data) {
        const d: any = data
        if (d[fld]) delete d[fld]
      }
    }

    return data
  }
}



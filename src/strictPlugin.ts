import type { Config, CollectionConfig } from 'payload'
import type {
  PluginOptions as CloudPluginOptions,
  CollectionOptions,
  GeneratedAdapter,
} from '@payloadcms/plugin-cloud-storage/types'

import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'

import { addPrevalidateHook } from './hooks/addPrevalidate.js'
import { ensureErrorField } from './fields/ensureErrorField.js'

interface CloudStorageStrictPluginOptions extends CloudPluginOptions {
  errorField?: string
}

type CollectionMeta = {
  errorField?: string
}

export const cloudStorageStrict =
  (pluginOptions: CloudStorageStrictPluginOptions) =>
  (incomingConfig: Config): Config => {
    const collectionMeta = new Map<string, CollectionMeta>()

    const strictCollections = Object.entries(pluginOptions.collections || {}).reduce(
      (acc, [slug, options]) => {
        if (!options || !options.adapter) {
          return acc
        }

        const collectionOptions = options
        const originalAdapterFactory = collectionOptions.adapter!

        acc[slug] = {
          ...collectionOptions,
          adapter: (adapterArgs) => {
            const baseAdapter = originalAdapterFactory(adapterArgs)
            const cloudflareOptions = (baseAdapter as any).cloudflareOptions || {}
            const collectionErrorField = (collectionOptions as any).errorField

            const resolvedErrorField =
              collectionErrorField ||
              cloudflareOptions.errorField ||
              pluginOptions.errorField ||
              (cloudflareOptions.onError === 'record' ? 'uploadError' : undefined)

            collectionMeta.set(slug, {
              errorField: resolvedErrorField,
            })

            const originalHandleUpload = baseAdapter.handleUpload?.bind(baseAdapter)

            const strictAdapter: GeneratedAdapter & { cloudflareOptions?: any } = {
              ...baseAdapter,
              handleUpload: async (uploadArgs) => {
                try {
                  await originalHandleUpload?.(uploadArgs)
                  if (resolvedErrorField && uploadArgs?.data?.[resolvedErrorField]) {
                    delete uploadArgs.data[resolvedErrorField]
                  }
                } catch (error: any) {
                  if (resolvedErrorField && uploadArgs?.data) {
                    ;(uploadArgs.data as Record<string, unknown>)[resolvedErrorField] =
                      error?.message || 'Upload failed'
                  }
                  throw error
                }
              },
            }

            if ((baseAdapter as any).cloudflareOptions) {
              strictAdapter.cloudflareOptions = (baseAdapter as any).cloudflareOptions
            }

            return strictAdapter
          },
        } satisfies CollectionOptions

        return acc
      },
      {} as Record<string, CollectionOptions>
    )

    const basePlugin = cloudStoragePlugin({
      ...pluginOptions,
      collections: strictCollections,
    })

    const config = basePlugin(incomingConfig)

    if (pluginOptions.enabled === false) {
      return config
    }

    return {
      ...config,
      collections: (config.collections || []).map((collection: CollectionConfig) => {
        const meta = collectionMeta.get(collection.slug)
        if (!meta) {
          return collection
        }

        const hooks = collection.hooks || {}
        const fields = Array.isArray(collection.fields) ? [...collection.fields] : []

        if (meta.errorField) {
          ensureErrorField(fields, meta.errorField)
        }

        return {
          ...collection,
          fields,
          hooks: {
            ...hooks,
            beforeValidate: addPrevalidateHook(hooks, {
              errorField: meta.errorField,
            }),
          },
        }
      }),
    }
  }

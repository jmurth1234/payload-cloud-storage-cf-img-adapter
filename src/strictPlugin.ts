import type { Config as PayloadConfig } from 'payload/config'
import type { CollectionConfig } from 'payload/types'
import type {
  PluginOptions as CloudPluginOptions,
  GeneratedAdapter,
  CollectionOptions,
} from '@payloadcms/plugin-cloud-storage/dist/types'
import { getFields } from '@payloadcms/plugin-cloud-storage/dist/fields/getFields'
import { getAfterDeleteHook } from '@payloadcms/plugin-cloud-storage/dist/hooks/afterDelete'
import { extendWebpackConfig } from '@payloadcms/plugin-cloud-storage/dist/webpack'
import { addPrevalidateHook } from './hooks/addPrevalidate'
import { getBeforeChangeHookStrict } from './hooks/addBeforeChange'

interface CloudStorageStrictPluginOptions extends CloudPluginOptions {
  errorField?: string
}

export const cloudStorageStrict =
  (pluginOptions: CloudStorageStrictPluginOptions) =>
  (incomingConfig: PayloadConfig): PayloadConfig => {
    const { collections: allCollectionOptions, enabled } = pluginOptions
    const config: PayloadConfig = { ...incomingConfig }

    const webpack = extendWebpackConfig({ config: incomingConfig, options: pluginOptions })
    ;(config as any).admin = { ...(config as any).admin || {}, webpack }

    const initFunctions: Array<() => void> = []

    return {
      ...config,
      collections: (config.collections || []).map((existingCollection: CollectionConfig) => {
        const options = (allCollectionOptions as Record<string, CollectionOptions>)[
          existingCollection.slug
        ]

        if (options?.adapter && enabled !== false) {
          const adapter: GeneratedAdapter = (options.adapter as any)({
            collection: existingCollection,
            prefix: options.prefix,
          })

          // expose onError/errorField for hooks via request context
          const cloudflareOptions = (adapter as any).cloudflareOptions || {}
          ;(adapter as any).cloudflareOptions = cloudflareOptions

          if (adapter.onInit) initFunctions.push(adapter.onInit)

          const fields = getFields({
            adapter,
            collection: existingCollection,
            disablePayloadAccessControl: options.disablePayloadAccessControl,
            generateFileURL: options.generateFileURL,
            prefix: options.prefix,
          })

          const handlers = [
            ...((typeof existingCollection.upload === 'object' &&
              Array.isArray((existingCollection as any).upload.handlers))
              ? (existingCollection as any).upload.handlers
              : []),
          ]

          if (!options.disablePayloadAccessControl) {
            handlers.push(adapter.staticHandler)
          }

          return {
            ...existingCollection,
            fields,
            hooks: {
              ...(existingCollection.hooks || {}),
              beforeValidate: addPrevalidateHook(existingCollection.hooks, pluginOptions),
              afterDelete: [
                ...(existingCollection.hooks?.afterDelete || []),
                getAfterDeleteHook({ adapter, collection: existingCollection }),
              ],
              beforeChange: [
                ...(existingCollection.hooks?.beforeChange || []),
                getBeforeChangeHookStrict({ adapter, collection: existingCollection }),
              ],
            },
            upload: {
              ...(typeof existingCollection.upload === 'object'
                ? (existingCollection as any).upload
                : {}),
              disableLocalStorage:
                typeof options.disableLocalStorage === 'boolean'
                  ? options.disableLocalStorage
                  : true,
              handlers,
            },
          }
        }

        return existingCollection
      }),
      onInit: async (payload) => {
        initFunctions.forEach(fn => fn())
        if (config.onInit) await config.onInit(payload)
      },
    }
  }



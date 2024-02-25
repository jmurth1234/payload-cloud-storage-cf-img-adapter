import type { Configuration as WebpackConfig } from 'webpack'

export const extendWebpackConfig = (config: WebpackConfig): WebpackConfig => {
  if (config?.resolve?.fallback && !Array.isArray(config.resolve.fallback)) {
    config.resolve.fallback.fs = false;
  }

  return config
}

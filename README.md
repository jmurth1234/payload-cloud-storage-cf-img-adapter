# Cloudflare Images Adapter for `@payloadcms/plugin-cloud-storage`

This is a Cloudflare Images adapter for the [Cloud Storage](https://github.com/payloadcms/payload/tree/main/packages/plugin-cloud-storage) plugin for [Payload CMS](https://payloadcms.com).

You can either use this as an adapter for the `@payloadcms/plugin-cloud-storage` or as a standalone package.

## Installation

```bash
yarn add payload-cloud-storage-cf-img-adapter
```

## Usage

First, make sure that in Cloudflare you have `Flexible variants` enabled. For now, this is required.

Then, enable this as an adapter in your config:

```ts
import { cloudflareStorage } from 'payload-cloud-storage-cf-img-adapter'

// ... 
const config = {
  // other config
  plugins: [
    cloudflareStorage({
      enabled: !!process.env.CLOUDFLARE_API_KEY,
      collections: {
        [Media.slug]: {
          disablePayloadAccessControl: true,
        },
      },
      apiKey: process.env.CLOUDFLARE_API_KEY as string,
      accountHash: process.env.CLOUDFLARE_ACCOUNT_HASH as string,
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID as string,
    }),
  ],
}

```

## Configuration

The `cloudflareStorage` function takes the following options:

- `apiKey`: Your Cloudflare API key
- `accountId`: Your Cloudflare account ID
- `accountHash`: Your Cloudflare account hash

These are all available in the Cloudflare dashboard.

Additionally, you can pass in the following options to the `cloudflareStorage` function:

- `enabled`: Whether to enable the adapter
- `collections`: The collections to enable the adapter for

## Development

First, run `yarn watch` to watch for changes in the `src` folder and compile them to the `dist` folder.

To run the tests, run `yarn test`.

To run the development server, run `yarn dev`. Make sure to put an `.env` file in the `packages/dev/` folder of the project with the following variables:

- `CLOUDFLARE_API_KEY`: Your Cloudflare API key
- `CLOUDFLARE_ACCOUNT_HASH`: Your Cloudflare account hash
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

You can also use the `.env.example` file as a template.

## Roadmap

- [ ] Use Cloudflare variants for images

## License

MIT
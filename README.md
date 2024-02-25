# Cloudflare Images Adapter for `@payloadcms/plugin-cloud-storage`

This is a Cloudflare Images adapter for the [Cloud Storage](https://github.com/payloadcms/payload/tree/main/packages/plugin-cloud-storage) plugin for [Payload CMS](https://payloadcms.com).

## Installation

```bash
yarn add payload-cloud-storage-cf-img-adapter
```

## Usage

First, make sure that in Cloudflare you have `Flexible variants` enabled. For now, this is required.

Then, enable this as an adapter in your config:

```ts
import { cloudflareAdapter } from 'payload-cloud-storage-cf-img-adapter'

// ... 
const config = {
  // other config
  plugins: [
    cloudStorage({
      collections: {
        media: {
          disablePayloadAccessControl: true,
          adapter: cloudflareAdapter({
            apiKey: process.env.CLOUDFLARE_API_KEY as string,
            accountHash: process.env.CLOUDFLARE_ACCOUNT_HASH as string,
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID as string,
          }),
        },
      },
    }),
  ],
}

```

## Configuration

The adapter takes the following options:

- `apiKey`: Your Cloudflare API key
- `accountId`: Your Cloudflare account ID
- `accountHash`: Your Cloudflare account hash

These are all available in the Cloudflare dashboard.

## Development

To run the tests, run `yarn test`.

To run the development server, run `yarn dev`. Make sure to put an `.env` file in the `dev/` folder of the project with the following variables:

- `CLOUDFLARE_API_KEY`: Your Cloudflare API key
- `CLOUDFLARE_ACCOUNT_HASH`: Your Cloudflare account hash
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

You can also use the `.env.example` file as a template.

## License

MIT
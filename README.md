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
### Strict error surfacing (optional)

By default, the upstream plugin logs adapter upload errors and proceeds. If you want failed uploads to return errors to clients and also persist the error message for later viewing:

- Use the strict wrapper to surface errors (request fails)
- It will also inject a read-only `uploadError` field (or your configured `errorField`) into the collection if it does not exist, so recorded errors can be displayed when using `onError: 'record'`

```ts
import { cloudStorageStrict, cloudflareAdapter } from 'payload-cloud-storage-cf-img-adapter'

export default buildConfig({
  plugins: [
    cloudStorageStrict({
      errorField: 'uploadError', // optional override
      collections: {
        media: {
          adapter: cloudflareAdapter({
            apiKey: process.env.CLOUDFLARE_API_KEY as string,
            accountHash: process.env.CLOUDFLARE_ACCOUNT_HASH as string,
            accountId: process.env.CLOUDFLARE_ACCOUNT_ID as string,
            onError: 'record', // or 'throw'
            errorField: 'uploadError',
          }),
        },
      },
    }),
  ],
})
```

The strict wrapper mirrors the plugin API but does not swallow adapter errors during `beforeChange`, ensuring failed uploads prevent document creation and return an error to clients.


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

## Roadmap

- [ ] Use Cloudflare variants for images

## License

MIT
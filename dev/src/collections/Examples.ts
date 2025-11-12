import { CollectionConfig } from 'payload/types';

// Example Collection - For reference only, this must be added to payload.config.ts to be used.
const Examples: CollectionConfig = {
  slug: 'examples',
  admin: {
    useAsTitle: 'someField',
  },
  upload: {
    staticURL: '/media',
    staticDir: 'media',
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'landscape',
        width: 800,
        height: 450,
        position: 'centre',
      },
      {
        name: 'landscape2x',
        width: 1920,
        height: 1280,
        position: 'centre',
      },
      {
        name: 'portrait',
        width: 600,
        height: 900,
        position: 'centre',
      },
      {
        name: 'square',
        width: 600,
        height: 600,
        position: 'centre',
      },
    ],
  },
  fields: [
    {
      name: 'someField',
      type: 'text',
    },
  ],
}

export default Examples;
import { getHandleUpload } from '../handleUpload'
import nock from 'nock'

// Mock the timestamp function to make tests deterministic
jest.mock('../generateURL', () => ({
  ...jest.requireActual('../generateURL'),
  generateTimestamp: jest.fn(() => '240101010203456'),
}))

// Mock Payload's ValidationError to avoid loading the full package (ESM)
jest.mock('payload', () => ({
  ValidationError: class ValidationError extends Error {
    errors?: Array<{ message?: string }>
    constructor({ errors }: { errors?: Array<{ message?: string }> }) {
      super(errors?.[0]?.message || 'Validation Error')
      this.errors = errors
    }
  },
}))
describe('handleUpload', () => {
  it('successfully uploads an image and returns expected data', async () => {
    const scope = nock('https://api.cloudflare.com/client/v4/accounts/')
      .post('/testAccountId/images/v1')
      .reply(200, { success: true })

    const handleUpload = getHandleUpload({
      apiKey: 'testApiKey',
      accountId: 'testAccountId',
      accountHash: 'testAccountHash',
    })

    const data: any = {}
    await handleUpload({
      file: {
        filename: 'test.jpg',
        buffer: Buffer.from('test'),
        filesize: 10,
        mimeType: 'image/jpeg',
      },
      data,
      // @ts-ignore - We don't currently use this anyway
      collection: {},
      req: {},
    })

    scope.done()

    expect(data.filename).toMatch(/^test_\d{19}\.jpg$/)
  })

  it('throws error on upload failure', async () => {
    const scope = nock('https://api.cloudflare.com/client/v4/accounts/')
      .post('/testFailedId/images/v1')
      .reply(400, { success: false })

    const handleUpload = getHandleUpload({
      apiKey: 'testApiKey',
      accountId: 'testFailedId',
      accountHash: 'testAccountHash',
    })

    await expect(
      handleUpload({
        file: {
          filename: 'test.jpg',
          buffer: Buffer.from('test'),
          filesize: 10,
          mimeType: 'image/jpeg',
        },
        data: {},
        // @ts-ignore - We don't currently use this anyway
        collection: {},
        req: {},
      }),
    ).rejects.toThrow(/Failed to upload image/)

    scope.done()
  })

  it('adds timestamp to filename correctly', () => {
    const { addTimestampToFilename } = jest.requireActual('../generateURL')

    const originalFilename = 'example.jpg'
    const timestampedFilename = addTimestampToFilename(originalFilename)

    // Should have the format: example_YYMMDDHHMMSSmmmXXXXXX.jpg
    expect(timestampedFilename).toMatch(/^example_\d{19}\.jpg$/)

    // Test with different extensions
    expect(addTimestampToFilename('test.png')).toMatch(/^test_\d{19}\.png$/)
    expect(addTimestampToFilename('image.gif')).toMatch(/^image_\d{19}\.gif$/)

    // Test with multiple dots in filename
    expect(addTimestampToFilename('my.test.file.jpeg')).toMatch(/^my\.test\.file_\d{19}\.jpeg$/)

    // Handles filenames without extensions
    expect(addTimestampToFilename('avatar')).toMatch(/^avatar_\d{19}$/)

    // Handles dotfiles
    expect(addTimestampToFilename('.env')).toMatch(/^\..+_\d{19}$/)
  })

  it('throws a meaningful error when Cloudflare returns HTML', async () => {
    const scope = nock('https://api.cloudflare.com/client/v4/accounts/')
      .post('/badAccount/images/v1')
      .reply(413, '<html>Payload Too Large</html>', {
        'content-type': 'text/html',
        'status-text': 'Payload Too Large',
      } as any)

    const handleUpload = getHandleUpload({
      apiKey: 'testApiKey',
      accountId: 'badAccount',
      accountHash: 'testAccountHash',
    })

    await expect(
      handleUpload({
        file: {
          filename: 'huge.jpg',
          buffer: Buffer.from('x'),
          filesize: 200 * 1024 * 1024,
          mimeType: 'image/jpeg',
        },
        data: {},
        // @ts-ignore - not used in test
        collection: {},
        req: {},
      }),
    ).rejects.toThrow(/Failed to upload image: Unexpected response/)

    scope.done()
  })

  it('correctly updates crop filenames with unique timestamps', async () => {
    const scope = nock('https://api.cloudflare.com/client/v4/accounts/')
      .post('/testAccountId/images/v1')
      .times(2)
      .reply(200, { success: true })

    const handleUpload = getHandleUpload({
      apiKey: 'testApiKey',
      accountId: 'testAccountId',
      accountHash: 'testAccountHash',
    })

    const data: any = {
      filename: 'test.jpg',
      sizes: {
        thumbnail: {
          filename: 'test-thumbnail.jpg',
          width: 150,
          height: 150,
        },
      },
    }

    // Upload main file
    await handleUpload({
      file: {
        filename: 'test.jpg',
        buffer: Buffer.from('test'),
        filesize: 10,
        mimeType: 'image/jpeg',
      },
      data,
      // @ts-ignore - We don't currently use this anyway
      collection: {},
      req: {},
    })

    // Upload crop
    await handleUpload({
      file: {
        filename: 'test-thumbnail.jpg',
        buffer: Buffer.from('test'),
        filesize: 5,
        mimeType: 'image/jpeg',
      },
      data,
      // @ts-ignore - We don't currently use this anyway
      collection: {},
      req: {},
    })

    scope.done()

    // Main filename should have timestamp
    expect(data.filename).toMatch(/^test_\d{19}\.jpg$/)

    // Crop filename should also have timestamp
    expect(data.sizes.thumbnail.filename).toMatch(/^test-thumbnail_\d{19}\.jpg$/)

    // Main and crop should have different timestamps
    expect(data.filename).not.toBe('test.jpg')
    expect(data.sizes.thumbnail.filename).not.toBe('test-thumbnail.jpg')
  })

  it('correctly handles multiple crops with unique timestamps', async () => {
    const scope = nock('https://api.cloudflare.com/client/v4/accounts/')
      .post('/testAccountId/images/v1')
      .times(4) // Main + 3 crops
      .reply(200, { success: true })

    const handleUpload = getHandleUpload({
      apiKey: 'testApiKey',
      accountId: 'testAccountId',
      accountHash: 'testAccountHash',
    })

    const data: any = {
      filename: 'photo.png',
      sizes: {
        thumbnail: {
          filename: 'photo-thumbnail.png',
          width: 150,
          height: 150,
        },
        medium: {
          filename: 'photo-medium.png',
          width: 800,
          height: 600,
        },
        large: {
          filename: 'photo-large.png',
          width: 1920,
          height: 1080,
        },
      },
    }

    // Upload main file
    await handleUpload({
      file: {
        filename: 'photo.png',
        buffer: Buffer.from('main'),
        filesize: 100,
        mimeType: 'image/png',
      },
      data,
      // @ts-ignore
      collection: {},
      req: {},
    })

    // Upload each crop
    await handleUpload({
      file: {
        filename: 'photo-thumbnail.png',
        buffer: Buffer.from('thumb'),
        filesize: 10,
        mimeType: 'image/png',
      },
      data,
      // @ts-ignore
      collection: {},
      req: {},
    })

    await handleUpload({
      file: {
        filename: 'photo-medium.png',
        buffer: Buffer.from('medium'),
        filesize: 50,
        mimeType: 'image/png',
      },
      data,
      // @ts-ignore
      collection: {},
      req: {},
    })

    await handleUpload({
      file: {
        filename: 'photo-large.png',
        buffer: Buffer.from('large'),
        filesize: 80,
        mimeType: 'image/png',
      },
      data,
      // @ts-ignore
      collection: {},
      req: {},
    })

    scope.done()

    // All filenames should have unique timestamps
    expect(data.filename).toMatch(/^photo_\d{19}\.png$/)
    expect(data.sizes.thumbnail.filename).toMatch(/^photo-thumbnail_\d{19}\.png$/)
    expect(data.sizes.medium.filename).toMatch(/^photo-medium_\d{19}\.png$/)
    expect(data.sizes.large.filename).toMatch(/^photo-large_\d{19}\.png$/)

    // All should be different from originals
    expect(data.filename).not.toBe('photo.png')
    expect(data.sizes.thumbnail.filename).not.toBe('photo-thumbnail.png')
    expect(data.sizes.medium.filename).not.toBe('photo-medium.png')
    expect(data.sizes.large.filename).not.toBe('photo-large.png')
  })

  it('correctly handles crop uploaded before main file', async () => {
    const scope = nock('https://api.cloudflare.com/client/v4/accounts/')
      .post('/testAccountId/images/v1')
      .times(2)
      .reply(200, { success: true })

    const handleUpload = getHandleUpload({
      apiKey: 'testApiKey',
      accountId: 'testAccountId',
      accountHash: 'testAccountHash',
    })

    // Data object with no main filename set yet, but has crop sizes defined
    const data: any = {
      sizes: {
        thumbnail: {
          filename: 'image-thumbnail.jpg',
          width: 150,
          height: 150,
        },
      },
    }

    // Upload crop BEFORE main file
    await handleUpload({
      file: {
        filename: 'image-thumbnail.jpg',
        buffer: Buffer.from('thumb'),
        filesize: 5,
        mimeType: 'image/jpeg',
      },
      data,
      // @ts-ignore
      collection: {},
      req: {},
    })

    // Upload main file after
    await handleUpload({
      file: {
        filename: 'image.jpg',
        buffer: Buffer.from('main'),
        filesize: 100,
        mimeType: 'image/jpeg',
      },
      data,
      // @ts-ignore
      collection: {},
      req: {},
    })

    scope.done()

    // Main filename should be set correctly
    expect(data.filename).toMatch(/^image_\d{19}\.jpg$/)
    expect(data.filename).not.toBe('image-thumbnail.jpg') // Should NOT be the crop filename

    // Crop filename should be updated correctly
    expect(data.sizes.thumbnail.filename).toMatch(/^image-thumbnail_\d{19}\.jpg$/)
    expect(data.sizes.thumbnail.filename).not.toBe('image-thumbnail.jpg')

    // They should be different
    expect(data.filename).not.toBe(data.sizes.thumbnail.filename)
  })
})

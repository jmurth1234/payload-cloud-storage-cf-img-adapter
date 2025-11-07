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
})

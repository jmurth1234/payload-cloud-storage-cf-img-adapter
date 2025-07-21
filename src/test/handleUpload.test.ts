import FormData from 'form-data'
import { getHandleUpload } from '../handleUpload.js'
import { addTimestampToFilename } from '../generateURL.js'
import nock from 'nock'

// Mock the timestamp function to make tests deterministic
jest.mock('../generateURL.js', () => ({
  ...jest.requireActual('../generateURL.js'),
  addTimestampToFilename: jest.fn((filename: string) => {
    // Return a predictable filename for testing
    const parts = filename.split('.')
    const extension = parts.pop()
    const baseName = parts.join('.')
    return `${baseName}_2024012345.${extension}`
  }),
}))

describe('handleUpload', () => {
  it('successfully uploads an image with timestamp and returns expected data', async () => {
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
      // @ts-ignore - We don't currently use this anyway
      req: {},
    })

    // Verify the filename was updated with timestamp in the data object
    expect(data.filename).toBe('test_2024012345.jpg')
    expect(addTimestampToFilename).toHaveBeenCalledWith('test.jpg')

    scope.done()
  })

  it('adds timestamp to filename correctly', () => {
    // Test the actual timestamp function (unmocked)
    jest.unmock('../generateURL.js')
    const { addTimestampToFilename, generateTimestamp } = jest.requireActual('../generateURL.js')
    
    const originalFilename = 'example.jpg'
    const timestampedFilename = addTimestampToFilename(originalFilename)
    
    // Should have the format: example_YYYYMMDDHH.jpg
    expect(timestampedFilename).toMatch(/^example_\d{10}\.jpg$/)
    
    // Test with different extensions
    expect(addTimestampToFilename('test.png')).toMatch(/^test_\d{10}\.png$/)
    expect(addTimestampToFilename('image.gif')).toMatch(/^image_\d{10}\.gif$/)
    
    // Test with multiple dots in filename
    expect(addTimestampToFilename('my.test.file.jpeg')).toMatch(/^my\.test\.file_\d{10}\.jpeg$/)
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

    try {
      await handleUpload({
        file: {
          filename: 'test.jpg',
          buffer: Buffer.from('test'),
          filesize: 10,
          mimeType: 'image/jpeg',
        },
        data: {},
        // @ts-ignore - We don't currently use this anyway
        collection: {},
        // @ts-ignore - We don't currently use this anyway
        req: {},
      })
    } catch (e) {
      expect(e).toEqual(new Error('Failed to upload image'))
    }

    scope.done()
  })
})

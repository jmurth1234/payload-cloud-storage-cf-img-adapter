import FormData from 'form-data'
import { getHandleUpload } from '../handleUpload'
import nock from 'nock'

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
        req: {},
      })
    } catch (e) {
      throw e
    }

    scope.done()
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
        req: {},
      })
    } catch (e) {
      expect(e).toEqual(new Error('Failed to upload image'))
    }

    scope.done()
  })
})

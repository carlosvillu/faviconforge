import { test, expect } from '../fixtures'
import { readFileSync } from 'fs'
import { join } from 'path'

test.describe('ICO API', () => {
  test('POST /api/favicon/ico returns ICO file', async ({
    request,
    appServer,
  }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    // Read valid test image
    const imagePath = join(
      process.cwd(),
      'tests/fixtures/images/valid-512x512.png'
    )
    const imageBuffer = readFileSync(imagePath)

    // Create form data
    const formData = new FormData()
    const blob = new Blob([imageBuffer], { type: 'image/png' })
    formData.append('file', blob, 'test.png')

    // POST to ICO API
    const response = await request.post(`${baseUrl}/api/favicon/ico`, {
      multipart: {
        file: {
          name: 'test.png',
          mimeType: 'image/png',
          buffer: imageBuffer,
        },
      },
    })

    expect(response.ok()).toBe(true)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toBe('image/x-icon')
    expect(response.headers()['content-disposition']).toContain(
      'attachment; filename="favicon.ico"'
    )

    // Verify body is not empty
    const body = await response.body()
    expect(body.length).toBeGreaterThan(0)
  })

  test('POST /api/favicon/ico rejects invalid file type', async ({
    request,
    appServer,
  }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    // Read invalid test image (GIF)
    const imagePath = join(
      process.cwd(),
      'tests/fixtures/images/invalid-format.gif'
    )
    const imageBuffer = readFileSync(imagePath)

    // POST to ICO API
    const response = await request.post(`${baseUrl}/api/favicon/ico`, {
      multipart: {
        file: {
          name: 'test.gif',
          mimeType: 'image/gif',
          buffer: imageBuffer,
        },
      },
    })

    expect(response.ok()).toBe(false)
    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(body.error).toBe('invalid_file_upload')
  })

  test('POST /api/favicon/ico rejects missing file', async ({
    request,
    appServer,
  }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    // POST with empty multipart form data
    const response = await request.post(`${baseUrl}/api/favicon/ico`, {
      multipart: {},
    })

    expect(response.ok()).toBe(false)
    expect(response.status()).toBe(400)

    const body = await response.json()
    expect(body.error).toBe('invalid_file_upload')
  })

  test('GET /api/favicon/ico returns 405', async ({ request, appServer }) => {
    const baseUrl = `http://localhost:${appServer.port}`

    const response = await request.get(`${baseUrl}/api/favicon/ico`)

    expect(response.status()).toBe(405)
  })
})

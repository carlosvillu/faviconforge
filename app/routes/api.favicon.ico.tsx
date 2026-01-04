import type { ActionFunctionArgs } from 'react-router'
import { generateICO } from '~/services/ico.server'

export async function loader() {
  return new Response('Method Not Allowed', { status: 405 })
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file')

    // Validate file exists and is a File
    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'invalid_file_upload' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate file type - only accept PNG and JPEG
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'invalid_file_upload' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate ICO
    const icoBuffer = await generateICO(buffer)

    // Return ICO file - convert Buffer to Uint8Array for Response
    return new Response(new Uint8Array(icoBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/x-icon',
        'Content-Disposition': 'attachment; filename="favicon.ico"',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'ico_generation_failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

import pngToIco from 'png-to-ico'
import sharp from 'sharp'

/**
 * Generates a multi-resolution ICO file from a PNG image buffer
 * Creates an ICO containing 16x16, 32x32, and 48x48 resolutions
 */
export async function generateICO(imageBuffer: Buffer): Promise<Buffer> {
  try {
    // Resize to all required ICO sizes
    const png16 = await sharp(imageBuffer)
      .resize(16, 16, { fit: 'cover' })
      .png()
      .toBuffer()

    const png32 = await sharp(imageBuffer)
      .resize(32, 32, { fit: 'cover' })
      .png()
      .toBuffer()

    const png48 = await sharp(imageBuffer)
      .resize(48, 48, { fit: 'cover' })
      .png()
      .toBuffer()

    // Generate ICO file from PNG buffers
    const icoBuffer = await pngToIco([png16, png32, png48])

    return icoBuffer
  } catch (error) {
    throw new Error(
      `ICO generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

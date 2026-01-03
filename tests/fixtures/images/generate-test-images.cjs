#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Generate test images for E2E tests
 * Run with: node tests/fixtures/images/generate-test-images.js
 */

const fs = require('fs')
const path = require('path')

// Simple PNG header for 1x1 pixel images
function createPNG(width, height, r = 255, g = 0, b = 0) {
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR chunk
  const ihdr = Buffer.alloc(25)
  ihdr.writeUInt32BE(13, 0) // chunk length
  ihdr.write('IHDR', 4, 'ascii')
  ihdr.writeUInt32BE(width, 8) // width
  ihdr.writeUInt32BE(height, 12) // height
  ihdr.writeUInt8(8, 16) // bit depth
  ihdr.writeUInt8(2, 17) // color type (RGB)
  ihdr.writeUInt8(0, 18) // compression
  ihdr.writeUInt8(0, 19) // filter
  ihdr.writeUInt8(0, 20) // interlace
  const ihdrCrc = crc32(ihdr.slice(4, 21))
  ihdr.writeUInt32BE(ihdrCrc, 21)

  // IDAT chunk with minimal image data
  const pixelData = Buffer.alloc(height * (1 + width * 3))
  for (let y = 0; y < height; y++) {
    pixelData[y * (1 + width * 3)] = 0 // filter type
    for (let x = 0; x < width; x++) {
      const offset = y * (1 + width * 3) + 1 + x * 3
      pixelData[offset] = r
      pixelData[offset + 1] = g
      pixelData[offset + 2] = b
    }
  }

  const zlib = require('zlib')
  const compressed = zlib.deflateSync(pixelData)
  const idat = Buffer.alloc(12 + compressed.length)
  idat.writeUInt32BE(compressed.length, 0)
  idat.write('IDAT', 4, 'ascii')
  compressed.copy(idat, 8)
  const idatCrc = crc32(idat.slice(4, 8 + compressed.length))
  idat.writeUInt32BE(idatCrc, 8 + compressed.length)

  // IEND chunk
  const iend = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130])

  return Buffer.concat([pngSignature, ihdr, idat, iend])
}

function createGIF(width, height) {
  // Minimal GIF87a format
  const header = Buffer.from('GIF87a', 'ascii')
  const screenDescriptor = Buffer.alloc(7)
  screenDescriptor.writeUInt16LE(width, 0)
  screenDescriptor.writeUInt16LE(height, 2)
  screenDescriptor[4] = 0x80 // global color table flag
  screenDescriptor[5] = 0 // background color
  screenDescriptor[6] = 0 // pixel aspect ratio

  // Global color table (2 colors)
  const colorTable = Buffer.from([
    255, 0, 0, // red
    0, 0, 0,   // black
  ])

  // Image descriptor
  const imageDescriptor = Buffer.alloc(10)
  imageDescriptor[0] = 0x2C // image separator
  imageDescriptor.writeUInt16LE(0, 1) // left
  imageDescriptor.writeUInt16LE(0, 3) // top
  imageDescriptor.writeUInt16LE(width, 5) // width
  imageDescriptor.writeUInt16LE(height, 7) // height
  imageDescriptor[9] = 0 // no local color table

  // Image data (minimal LZW compressed data)
  const imageData = Buffer.from([0x02, 0x02, 0x4C, 0x01, 0x00])

  // Trailer
  const trailer = Buffer.from([0x3B])

  return Buffer.concat([header, screenDescriptor, colorTable, imageDescriptor, imageData, trailer])
}

function crc32(buffer) {
  let crc = 0xFFFFFFFF
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i]
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0)
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

const dir = __dirname

// 1. Valid 512x512 PNG
fs.writeFileSync(
  path.join(dir, 'valid-512x512.png'),
  createPNG(512, 512, 0, 128, 255)
)

// 2. Invalid format (GIF)
fs.writeFileSync(
  path.join(dir, 'invalid-format.gif'),
  createGIF(512, 512)
)

// 3. Non-square 1024x512 PNG (both dimensions >= 512 but not square)
fs.writeFileSync(
  path.join(dir, 'non-square-1024x512.png'),
  createPNG(1024, 512, 255, 128, 0)
)

// 4. Too small 200x200 PNG
fs.writeFileSync(
  path.join(dir, 'too-small-200x200.png'),
  createPNG(200, 200, 128, 255, 0)
)

console.log('Test images generated successfully!')

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Function to generate a solid or shaped RGBA PNG buffer without external dependencies
function createPng(width, height, drawFn) {
  // RGBA buffer: width * height * 4
  const rgba = Buffer.alloc(width * height * 4);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rgba[idx] = r;
      rgba[idx + 1] = g;
      rgba[idx + 2] = b;
      rgba[idx + 3] = a;
    }
  }

  // PNG filter type 0 (None) before each scanline
  const scanlineLength = width * 4 + 1;
  const filtered = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    filtered[y * scanlineLength] = 0; // Filter type: None
    rgba.copy(filtered, y * scanlineLength + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressedData = zlib.deflateSync(filtered);

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA color type
  ihdrData[10] = 0; // Deflate
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(len + 12);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4);
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, len + 8));
  buf.writeUInt32BE(crc, len + 8);
  return buf;
}

// CRC-32 implementation
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Pixel drawer for Minhas Economias brand
function brandPixel(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Background color #82af07 (r=130, g=175, b=7)
  let r = 130;
  let g = 175;
  let b = 7;
  let a = 255;

  // Outer corner rounding for standard icons (unless maskable)
  if (!isMaskable) {
    const rx = Math.abs(x - cx);
    const ry = Math.abs(y - cy);
    const cornerRadius = w * 0.22;
    const innerW = cx - cornerRadius;
    const innerH = cy - cornerRadius;
    if (rx > innerW && ry > innerH) {
      const cdx = rx - innerW;
      const cdy = ry - innerH;
      if (Math.sqrt(cdx * cdx + cdy * cdy) > cornerRadius) {
        return [0, 0, 0, 0]; // transparent outside rounded corner
      }
    }
  }

  // Circular halo
  if (dist < w * 0.38) {
    // slightly lighter green
    r = Math.min(255, r + 15);
    g = Math.min(255, g + 15);
  }

  // Central Wallet / Bank emblem
  const scale = w / 512;
  const boxW = 260 * scale;
  const boxH = 170 * scale;
  const boxLeft = cx - boxW / 2;
  const boxRight = cx + boxW / 2;
  const boxTop = cy - boxH / 2;
  const boxBottom = cy + boxH / 2;

  if (x >= boxLeft && x <= boxRight && y >= boxTop && y <= boxBottom) {
    // Card background: white
    r = 255;
    g = 255;
    b = 255;

    // Green stripe across card
    const stripeY = boxTop + 40 * scale;
    if (y >= stripeY && y <= stripeY + 12 * scale) {
      r = 130;
      g = 175;
      b = 7;
    }
  }

  // Coin emblem
  const coinCx = cx + 45 * scale;
  const coinCy = cy;
  const coinR = 48 * scale;
  const coinDist = Math.sqrt((x - coinCx) ** 2 + (y - coinCy) ** 2);

  if (coinDist <= coinR) {
    // Golden coin #f59e0b / #ffdd44
    r = 250;
    g = 190;
    b = 20;
    if (coinDist > coinR - 4 * scale) {
      r = 217;
      g = 119;
      b = 6;
    }
  }

  return [r, g, b, a];
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPng(192, 192, (x, y, w, h) => brandPixel(x, y, w, h, false)));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPng(512, 512, (x, y, w, h) => brandPixel(x, y, w, h, false)));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), createPng(512, 512, (x, y, w, h) => brandPixel(x, y, w, h, true)));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPng(180, 180, (x, y, w, h) => brandPixel(x, y, w, h, false)));

console.log('Successfully generated all PWA icons in /public!');

import sharp from 'sharp';

const TARGET_WIDTH = 1242;
const TARGET_HEIGHT = 2688;
const BACKGROUND_COLOR = { r: 0, g: 0, b: 0, alpha: 1 }; // #000000

/**
 * Takes a raw Gemini-generated image (9:16 aspect ratio) and processes it
 * to exact App Store dimensions (1242 x 2688px).
 *
 * Strategy:
 * 1. Resize to TARGET_WIDTH maintaining aspect ratio
 * 2. If shorter than TARGET_HEIGHT, extend canvas with Stadium Navy padding
 * 3. If taller, center-crop to TARGET_HEIGHT
 */
export async function postProcessScreenshot(
  inputBase64: string,
): Promise<Buffer> {
  const inputBuffer = Buffer.from(inputBase64, 'base64');

  const resizedBuffer = await sharp(inputBuffer)
    .resize(TARGET_WIDTH, null, { fit: 'inside', withoutEnlargement: false })
    .toBuffer();

  const { height: currentHeight } = await sharp(resizedBuffer).metadata();

  if (!currentHeight) {
    throw new Error('Could not read image dimensions after resize');
  }

  if (currentHeight < TARGET_HEIGHT) {
    const totalPadding = TARGET_HEIGHT - currentHeight;
    const topPadding = Math.floor(totalPadding / 2);
    const bottomPadding = totalPadding - topPadding;

    return sharp(resizedBuffer)
      .extend({
        top: topPadding,
        bottom: bottomPadding,
        left: 0,
        right: 0,
        background: BACKGROUND_COLOR,
      })
      .png()
      .toBuffer();
  }

  if (currentHeight > TARGET_HEIGHT) {
    const cropTop = Math.floor((currentHeight - TARGET_HEIGHT) / 2);

    return sharp(resizedBuffer)
      .extract({
        left: 0,
        top: cropTop,
        width: TARGET_WIDTH,
        height: TARGET_HEIGHT,
      })
      .png()
      .toBuffer();
  }

  return sharp(resizedBuffer).png().toBuffer();
}

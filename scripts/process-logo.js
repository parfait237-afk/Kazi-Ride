const fs = require('fs');
const path = require('path');
const Jimp = require('jimp-compact');

const root = path.resolve(__dirname, '..');
const sourcePath = path.join(root, 'assets', 'images', 'kaziride-logo-source.png');
const outputDir = path.join(root, 'assets', 'images');

async function containOnCanvas(source, canvasSize, logoSize, background) {
  const logo = await Jimp.read(source);
  logo.contain(logoSize, logoSize, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE);

  const canvas = new Jimp(canvasSize, canvasSize, background);
  const x = Math.round((canvasSize - logo.bitmap.width) / 2);
  const y = Math.round((canvasSize - logo.bitmap.height) / 2);
  canvas.composite(logo, x, y);
  return canvas;
}

async function writePng(image, filename) {
  const target = path.join(outputDir, filename);
  await image.writeAsync(target);
  return target;
}

function inspect(image, filename) {
  const cornerAlpha = Jimp.intToRGBA(image.getPixelColor(0, 0)).a;
  return {
    file: filename,
    width: image.bitmap.width,
    height: image.bitmap.height,
    cornerAlpha,
  };
}

async function main() {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Logo source not found: ${sourcePath}`);
  }

  const mainLogo = await containOnCanvas(sourcePath, 1024, 1024, 0x00000000);
  const adaptiveIcon = await containOnCanvas(sourcePath, 1024, 680, 0x00000000);
  const splashLogo = await containOnCanvas(sourcePath, 1024, 760, 0x00000000);
  const iosIcon = await containOnCanvas(sourcePath, 1024, 780, 0x001b4eff);
  const favicon = await containOnCanvas(sourcePath, 512, 440, 0x00000000);

  const outputs = [
    [mainLogo, 'kaziride-logo.png'],
    [adaptiveIcon, 'kaziride-adaptive-icon.png'],
    [splashLogo, 'kaziride-splash-logo.png'],
    [iosIcon, 'kaziride-icon.png'],
    [favicon, 'kaziride-favicon.png'],
  ];

  for (const [image, filename] of outputs) {
    await writePng(image, filename);
    console.log(JSON.stringify(inspect(image, filename)));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

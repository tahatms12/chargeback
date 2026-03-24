const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure jimp is installed
try {
  require.resolve('jimp');
} catch (e) {
  console.log('Installing jimp...');
  execSync('npm install jimp@0.22.10 --no-save', { stdio: 'inherit' });
}

const Jimp = require('jimp');

const apps = [
  { file: 'image1_fixitcsv.jpg', destDirs: ['FixitCSV/public'] },
  { file: 'image2_craftline.jpg', destDirs: ['Craftline/public'] },
  { file: 'image3_stagewise.jpg', destDirs: ['Stagewise/public'] },
  { file: 'image4_customsready.jpg', destDirs: ['customsready/public'] },
  { file: 'image5_quoteloop.jpg', destDirs: ['apps/quoteloop-new/public'] },
  { file: 'image6_poref.jpg', destDirs: ['apps/poref-new/public'] }
];

const basePath = 'C:\\Users\\Admin\\Downloads\\shopifyapps\\final\\chargeback';

async function processImages() {
  for (const app of apps) {
    const source = path.join(basePath, app.file);
    if (!fs.existsSync(source)) {
      console.warn(`Source file not found: ${source}`);
      continue;
    }

    const sizes = [192, 512];
    
    for (const dir of app.destDirs) {
      const targetDir = path.join(basePath, dir);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      for (const size of sizes) {
        const dest = path.join(targetDir, `logo-${size}x${size}.png`);
        try {
          const image = await Jimp.read(source);
          await image.cover(size, size).writeAsync(dest);
          console.log(`Created ${dest}`);
        } catch (err) {
          console.error(`Error processing ${source} to ${size}x${size}:`, err);
        }
      }
      
       const destIcon = path.join(targetDir, `icon.png`);
       try {
          const image = await Jimp.read(source);
          await image.cover(512, 512).writeAsync(destIcon);
          console.log(`Created ${destIcon}`);
        } catch (err) {
          console.error(`Error processing ${source} to icon.png:`, err);
        }
    }
  }
}

processImages();

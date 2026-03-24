const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure sharp is installed
try {
  require.resolve('sharp');
} catch (e) {
  console.log('Installing sharp...');
  execSync('npm install sharp --no-save', { stdio: 'inherit' });
}

const sharp = require('sharp');

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

    // Typical icon sizes: 192, 512, and optionally a favicon.ico
    const sizes = [192, 512];
    
    for (const dir of app.destDirs) {
      const targetDir = path.join(basePath, dir);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      for (const size of sizes) {
        const dest = path.join(targetDir, `logo-${size}x${size}.png`);
        try {
          await sharp(source)
            .resize(size, size, { fit: 'cover' })
            .toFile(dest);
          console.log(`Created ${dest}`);
        } catch (err) {
          console.error(`Error processing ${source} to ${size}x${size}:`, err);
        }
      }
      
      // Also save a general icon.png
       const destIcon = path.join(targetDir, `icon.png`);
       try {
          await sharp(source)
            .resize(512, 512, { fit: 'cover' })
            .toFile(destIcon);
          console.log(`Created ${destIcon}`);
        } catch (err) {
          console.error(`Error processing ${source} to icon.png:`, err);
        }
    }
  }
}

processImages();

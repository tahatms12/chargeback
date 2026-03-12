const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const apps = ['craftline', 'fixitcsv', 'stagewise', 'customsready', 'poref', 'quoteloop'];
const basePath = path.join(__dirname, 'public', 'assets');

async function captureScreenshots() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set viewport to the exact size of our mockup frame (plus a bit of margin)
  await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 2 });

  for (const slug of apps) {
    console.log(`Capturing mockup for ${slug}...`);
    
    // Ensure output directory exists
    const dir = path.join(basePath, slug, 'screenshots');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Navigate to the local mockup route
    await page.goto(`http://localhost:3000/mockups/${slug}`, { waitUntil: 'networkidle0' });
    
    // Additional wait for fonts/styles
    await new Promise(r => setTimeout(r, 1000));
    
    // Target the frame specifically to avoid the gray background if desired, or just take the whole viewport
    const element = await page.$('.w-\\[1024px\\]'); 
    if (element) {
        await element.screenshot({ path: path.join(dir, 'dashboard.png') });
    } else {
        await page.screenshot({ path: path.join(dir, 'dashboard.png') });
    }
    console.log(`Saved screenshot for ${slug}`);
  }

  await browser.close();
  console.log('All screenshots captured successfully.');
}

captureScreenshots().catch(console.error);

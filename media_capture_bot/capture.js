const { chromium } = require('playwright');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

(async () => {
    console.log("========================================");
    console.log("🎥 CUSTOMSREADY LITE MEDIA CAPTURE BOT");
    console.log("========================================\n");

    const mediaDir = 'C:\\Users\\Admin\\Desktop\\customsready media';
    
    console.log("Launching capturing browser (1600x900)...");
    const browser = await chromium.launch({ headless: false });
    
    // Shopify App Store ideal dimensions: 1600x900
    const context = await browser.newContext({
        recordVideo: {
            dir: mediaDir,
            size: { width: 1600, height: 900 }
        },
        viewport: { width: 1600, height: 900 }
    });
    
    const page = await context.newPage();

    console.log("\n✅ Browser launched and recording started!");
    console.log(`Video will be saved safely to: ${mediaDir}`);
    
    await askQuestion(`\n[STEP 1] Please log into your Shopify Partner Dashboard or Test Store (uplift-technologies-2).\nNavigate to a Test Order page where the Customs Readiness extension is visible.\n\nPress ENTER when you are ready to take Screenshot 1...`);
    
    console.log("\n📸 Taking Screenshot 1: Order Details Block...");
    await page.screenshot({ path: path.join(mediaDir, 'screenshot_1_order_block.png') });
    console.log("✔ Saved: screenshot_1_order_block.png");

    await askQuestion(`\n[STEP 2] Now, click 'Generate Customs Invoice' to record the workflow in the video.\nThen, navigate to the main CustomsReady App Dashboard (Apps -> CustomsReady Lite).\n\nPress ENTER when you are on the main Dashboard to take Screenshot 2...`);

    console.log("\n📸 Taking Screenshot 2: App Dashboard...");
    await page.screenshot({ path: path.join(mediaDir, 'screenshot_2_dashboard.png') });
    console.log("✔ Saved: screenshot_2_dashboard.png");

    await askQuestion(`\n[STEP 3] If you have an HS Lookup or Duty Calculator route, navigate to it now and fill it in.\n(If not, just open an Order Detail page inside the app).\n\nPress ENTER when ready to take Screenshot 3...`);

    console.log("\n📸 Taking Screenshot 3: Features & Lookup...");
    await page.screenshot({ path: path.join(mediaDir, 'screenshot_3_features.png') });
    console.log("✔ Saved: screenshot_3_features.png");

    console.log("\n🎬 Wrapping up recording and saving files...");
    await context.close();
    await browser.close();
    rl.close();

    console.log("\n========================================");
    console.log("🎉 ALL DONE! Media successfully generated!");
    console.log(`Check your Desktop folder: ${mediaDir}`);
    console.log("Note: Playwright generates .webm videos. Shopify accepts .webm, or you can upload directly to YouTube/Loom.");
    console.log("========================================");
})();

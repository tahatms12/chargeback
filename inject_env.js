const fs = require('fs');
const path = require('path');

const credentials = {
  'Craftline': { clientId: 'c8804da311dd652cf7f23b99b5250e84', clientSecret: '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' },
  'FixitCSV': { clientId: '1d81ef94081a2c788405f34bf1869a8b', clientSecret: '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' },
  'Stagewise': { clientId: '08fb1edbc0d92eda9b2e42e1934f8079', clientSecret: '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' },
  'customsready': { clientId: '4f41ad971e2764edd783199602e89f90', clientSecret: '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' },
  'apps/poref-new': { clientId: '59ed62f675a6cb042c7079b3379bec5c', clientSecret: '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' },
  'apps/quoteloop-new': { clientId: 'c0a7f6741dfc891c848bba84360c66da', clientSecret: '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' }
};

const rootPath = 'c:/Users/Admin/Downloads/shopifyapps/final/chargeback';
const pasteValuesFile = path.join(rootPath, 'docs/final/PASTE_THESE_VALUES.md');
const content = fs.readFileSync(pasteValuesFile, 'utf8');

const blocks = content.split('=== APP: ');
blocks.shift(); // remove header

for (const block of blocks) {
  const appNameMatch = block.match(/^(.*?)\s*===/);
  if (!appNameMatch) continue;
  let appName = appNameMatch[1].trim();

  // Handle poref-new / quoteloop-new folder names if mismatch
  if (appName === 'poref-new') appName = 'apps/poref-new';
  if (appName === 'quoteloop-new') appName = 'apps/quoteloop-new';

  const creds = credentials[appName] || credentials[`apps/${appName}`] || credentials[appName.replace('apps/', '')];
  if (!creds) {
    console.error(`No creds for ${appName}`);
    continue;
  }

  // Find .env section
  const envSectionMatch = block.match(/File: `(.*?\/\.env)`\s*---\s*([\s\S]*?)\s*---/);
  if (envSectionMatch) {
    const relPath = envSectionMatch[1];
    let envContent = envSectionMatch[2];
    
    envContent = envContent.replace('PASTE_KEY_HERE', creds.clientId);
    envContent = envContent.replace('PASTE_SECRET_HERE', creds.clientSecret);

    const fullEnvPath = path.join(rootPath, relPath);
    if (!fs.existsSync(path.dirname(fullEnvPath))) fs.mkdirSync(path.dirname(fullEnvPath), { recursive: true });
    
    fs.writeFileSync(fullEnvPath, envContent.trim() + '\n');
    console.log(`Wrote ${fullEnvPath}`);
  }
}

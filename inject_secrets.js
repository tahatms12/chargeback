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

for (const [app, creds] of Object.entries(credentials)) {
  const envPath = path.join(rootPath, app, '.env');
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(/SHOPIFY_API_KEY=.*/, `SHOPIFY_API_KEY=${creds.clientId}`);
    envContent = envContent.replace(/SHOPIFY_API_SECRET=.*/, `SHOPIFY_API_SECRET=${creds.clientSecret}`);
    fs.writeFileSync(envPath, envContent);
    console.log(`Updated .env for ${app}`);
  }

  const tomlPath = path.join(rootPath, app, 'shopify.app.toml');
  if (fs.existsSync(tomlPath)) {
    let tomlContent = fs.readFileSync(tomlPath, 'utf8');
    tomlContent = tomlContent.replace(/client_id\s*=\s*["'].*?["']/, `client_id = "${creds.clientId}"`);
    fs.writeFileSync(tomlPath, tomlContent);
    console.log(`Updated toml for ${app}`);
  }
}

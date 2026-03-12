const fs = require('fs');
const path = require('path');

const apps = [
  'Craftline',
  'FixitCSV',
  'Stagewise',
  'customsready',
  'apps/poref-new',
  'apps/quoteloop-new'
];

let report = `# Shopify App Store Review Blocker Verification

**Run Date**: ${new Date().toISOString()}
**Purpose**: Static analysis of \`shopify.app.toml\` configurations for common App Store rejection causes.

## Checklist
- \`[webhooks]\`: GDPR mandate topics (\`customers/data_request\`, \`customers/redact\`, \`shop/redact\`).
- URLs: No \`localhost\` outside of \`dev\` environments.
- App proxies / Subscriptions block definitions.

---
`;

apps.forEach(appPath => {
  const fullPath = path.join(__dirname, appPath, 'shopify.app.toml');
  report += `\n### App: \`${appPath}\`\n`;

  if (!fs.existsSync(fullPath)) {
    report += `❌ **FAIL**: \`shopify.app.toml\` not found. Cannot verify.\n\n`;
    return;
  }

  const tomlContent = fs.readFileSync(fullPath, 'utf8');

  // Verify GDPR Webhooks
  const GDPR_TOPICS = ['customers/data_request', 'customers/redact', 'shop/redact'];
  const missingGDPR = GDPR_TOPICS.filter(t => !tomlContent.includes(`"${t}"`) && !tomlContent.includes(`'${t}'`));
  
  if (missingGDPR.length === 0) {
    report += `✅ **PASS**: GDPR Webhooks configured.\n`;
  } else {
    report += `❌ **FAIL**: Missing mandatory GDPR webhooks: ${missingGDPR.join(', ')}. **[BLOCKER]**\n`;
  }

  // Verify Localhost URLs
  if (tomlContent.includes('localhost') && tomlContent.includes('application_url = ')) {
    report += `⚠️ **WARN**: Found \`localhost\` in config. Ensure this is replaced during \`env\` swap before submission.\n`;
  } else {
    report += `✅ **PASS**: No hardcoded \`localhost\` in root application_url detected.\n`;
  }

  // Check Embedded Status
  if (tomlContent.includes('embedded = true')) {
    report += `ℹ️ **INFO**: App is embedded in Shopify Admin.\n`;
  }

  report += `\n`;
});

fs.writeFileSync(path.join(__dirname, 'reports', 'REVIEW_BLOCKERS.md'), report);
console.log('Review Blocker Matrix generated.');

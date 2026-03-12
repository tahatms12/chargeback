const fs = require('fs');
const path = require('path');

const apps = [
  { slug: "craftline", hasBilling: false, theme: false, pcd: false },
  { slug: "fixitcsv", hasBilling: false, theme: false, pcd: false },
  { slug: "stagewise", hasBilling: false, theme: false, pcd: false },
  { slug: "customsready", hasBilling: true, theme: false, pcd: true },
  { slug: "poref", hasBilling: false, theme: true, pcd: true },
  { slug: "quoteloop", hasBilling: false, theme: false, pcd: true }
];

apps.forEach(app => {
  const dir = path.join(__dirname, 'reports', app.slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const reqs = {
    "listing_requirement": { applicable: true, state: "Pending Phase 7", required: "Draft listing copy" },
    "privacy_policy": { applicable: true, state: "Pending Phase 4", required: "Create /privacy" },
    "support_page": { applicable: true, state: "Pending Phase 4", required: "Create /support" },
    "screenshots": { applicable: true, state: "Pending Phase 6", required: "Capture strictly truthful UI screenshots" },
    "emergency_contact": { applicable: true, state: "Pending Phase 7", required: "Ensure contact details exist" },
    "compliance_webhooks": { applicable: true, state: "Pending Phase 9", required: "Validate webhook config in app TOML" },
    "embedded_auth": { applicable: true, state: "Implemented", required: "Uses Shopify App Bridge and session tokens" },
    "billing_compliance": { applicable: app.hasBilling, state: app.hasBilling ? "Pending Phase 9" : "N/A", required: app.hasBilling ? "Verify real billing API usage" : "None" },
    "theme_extension": { applicable: app.theme, state: app.theme ? "Pending Phase 4" : "N/A", required: app.theme ? "Include theme install instructions" : "None" },
    "protected_customer_data": { applicable: app.pcd, state: app.pcd ? "Pending Phase 8" : "N/A", required: app.pcd ? "Ensure data minimization in privacy policy" : "None" },
    "uninstall_data_deletion": { applicable: true, state: "Pending Phase 4", required: "Explain data retention on uninstall" }
  };

  fs.writeFileSync(path.join(dir, 'requirements-matrix.json'), JSON.stringify(reqs, null, 2));

  let md = `# Requirements Matrix: ${app.slug}\n\n| Requirement | Applicable | State | Required Implementation |\n|---|---|---|---|\n`;
  for (const [k, v] of Object.entries(reqs)) {
    md += `| ${k} | ${v.applicable} | ${v.state} | ${v.required} |\n`;
  }
  fs.writeFileSync(path.join(dir, 'requirements-matrix.md'), md);
});
console.log("Requirements matrices generated.");

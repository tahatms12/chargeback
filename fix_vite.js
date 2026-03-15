const fs = require('fs');
const files = [
  'Craftline/vite.config.ts',
  'FixitCSV/vite.config.ts',
  'Stagewise/vite.config.ts',
  'apps/poref-new/vite.config.ts',
  'apps/quoteloop-new/vite.config.ts',
  'customsready/vite.config.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace preset import safely
  content = content.replace(
    /import\s+?\{\s*?netlifyPreset\s*?\}\s+?from\s+?['"]@netlify\/remix-adapter\/preset['"];?\r?\n/g,
    ''
  );
  
  if (!content.includes('netlifyPlugin')) {
    content = content.replace(
      /import\s+?\{\s*?defineConfig\s*?\}\s+?from\s+?['"]vite['"];?\r?\n/g,
      'import { defineConfig } from "vite";\nimport { netlifyPlugin } from "@netlify/remix-adapter/plugin";\n'
    );
  }

  // Remove presets: [netlifyPreset()], safely
  content = content.replace(/\s*presets:\s*\[netlifyPreset\(\)\],?\r?\n/g, '\n');

  // Insert netlifyPlugin(), after remix() plugin block if missing
  if (!content.match(/netlifyPlugin\(\),/)) {
    content = content.replace(
      /(\s*remix\(\{[\s\S]*?\}\),)/,
      '$1\n    netlifyPlugin(),'
    );
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed', file);
}

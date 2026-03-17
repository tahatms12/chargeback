const fs = require('fs');
const path = require('path');

const apps = ['Craftline', 'FixitCSV', 'Stagewise', 'customsready', 'apps/poref-new', 'apps/quoteloop-new'];

const baseTsconfig = {
  compilerOptions: {
    lib: ["DOM", "DOM.Iterable", "ES2022"],
    isolatedModules: true,
    esModuleInterop: true,
    jsx: "react-jsx",
    module: "ESNext",
    moduleResolution: "Bundler",
    resolveJsonModule: true,
    target: "ES2022",
    strict: true,
    allowJs: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true
  }
};
fs.writeFileSync('tsconfig.base.json', JSON.stringify(baseTsconfig, null, 2));

for (const app of apps) {
  const tsconfigPath = path.join(app, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    if (!tsconfig.compilerOptions) tsconfig.compilerOptions = {};
    for (const key of Object.keys(baseTsconfig.compilerOptions)) {
      delete tsconfig.compilerOptions[key];
    }
    tsconfig.extends = app.startsWith('apps/') ? "../../tsconfig.base.json" : "../tsconfig.base.json";
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    console.log(`Updated ${tsconfigPath}`);
  }
  
  const pkgPath = path.join(app, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg.devDependencies) {
      delete pkg.devDependencies.typescript;
      delete pkg.devDependencies.prisma;
    }
    if (pkg.dependencies) {
      delete pkg.dependencies.prisma;
    }
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log(`Updated ${pkgPath}`);
  }
}

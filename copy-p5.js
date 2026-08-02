const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, '..', 'node_modules', 'p5', 'lib', 'p5.min.js');
const destDir = path.join(__dirname, '..', 'www', 'vendor');
const dest = path.join(destDir, 'p5.min.js');
if (!fs.existsSync(src)) {
  console.error('p5.min.js not found. Run npm install first.');
  process.exit(1);
}
fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('Copied p5.min.js to www/vendor/p5.min.js');

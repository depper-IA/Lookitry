const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const HERO_DIR = path.join(PUBLIC_DIR, 'hero');
const STEPS_DIR = path.join(PUBLIC_DIR, 'steps');
const PRODUCTS_DIR = path.join(PUBLIC_DIR, 'products');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');

async function convertToWebP(inputPath) {
  const outputPath = inputPath.replace(/\.png$/, '.webp');
  
  // Skip if already WebP
  if (inputPath.endsWith('.webp')) {
    console.log(`Skipping (already WebP): ${inputPath}`);
    return;
  }
  
  // Skip if WebP already exists
  if (fs.existsSync(outputPath)) {
    console.log(`Skipping (WebP exists): ${outputPath}`);
    return;
  }
  
  console.log(`Converting: ${inputPath} → ${outputPath}`);
  try {
    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(outputPath);
    const origSize = fs.statSync(inputPath).size;
    const newSize = fs.statSync(outputPath).size;
    const savings = ((1 - newSize / origSize) * 100).toFixed(1);
    console.log(`  ✓ Created: ${outputPath} (${savings}% smaller)`);
  } catch (err) {
    console.error(`  ✗ Error converting ${inputPath}:`, err.message);
  }
}

async function main() {
  const dirs = [
    { path: HERO_DIR, desc: 'hero' },
    { path: STEPS_DIR, desc: 'steps' },
    { path: PRODUCTS_DIR, desc: 'products' },
    { path: IMAGES_DIR, desc: 'images' },
  ];
  
  let totalConverted = 0;
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir.path)) {
      console.log(`\n📁 ${dir.desc}/ — not found, skipping`);
      continue;
    }
    
    const files = fs.readdirSync(dir.path).filter(f => f.endsWith('.png'));
    if (files.length === 0) {
      console.log(`\n📁 ${dir.desc}/ — no PNG files`);
      continue;
    }
    
    console.log(`\n📁 ${dir.desc}/ (${files.length} PNG files)`);
    
    for (const file of files) {
      await convertToWebP(path.join(dir.path, file));
      totalConverted++;
    }
  }
  
  console.log(`\n✅ Done! Processed ${totalConverted} files.`);
}

main();

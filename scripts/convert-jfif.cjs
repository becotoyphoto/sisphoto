const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const DIR = path.join(process.cwd(), 'public', 'images', 'categorias');

async function convert() {
  const files = fs.readdirSync(DIR);
  const targets = files.filter(f => /\.(jfif|jpg|jpeg)$/i.test(f));
  
  console.log(`Encontrados ${targets.length} arquivos para converter:`);
  
  for (const file of targets) {
    const input = path.join(DIR, file);
    const output = path.join(DIR, file.replace(/\.(jfif|jpg|jpeg)$/i, '.webp'));
    
    try {
      const buf = await sharp(input).webp(80).toBuffer();
      fs.writeFileSync(output, buf);
      const inStat = fs.statSync(input);
      const outStat = fs.statSync(output);
      const ratio = ((1 - outStat.size / inStat.size) * 100).toFixed(0);
      console.log(`  ✓ ${file} → ${output.split(path.sep).pop()} (${ratio}% menor)`);
    } catch (err) {
      console.error(`  ✗ ${file}: ${err.message}`);
    }
  }
  
  console.log('\nConversão concluída!');
}

convert();

import { readFileSync } from 'fs';
import { createRequire } from 'module';
const req = createRequire(import.meta.url);
const pdfParse = req('pdf-parse');

async function main() {
  const buffer = readFileSync('/home/user/workspace/sterling-accuris-pathology-sample-report-unlocked.pdf');
  const parser = new pdfParse.PDFParse({ data: buffer });
  const result = await parser.getText();
  const lines = result.text.split('\n');
  
  // Find ALT/AST lines
  console.log('=== ALT/AST lines ===');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].toLowerCase();
    if (l.includes('alt') || l.includes('ast') || l.includes('sgpt') || l.includes('sgot') || 
        l.includes('alanine') || l.includes('aspartate') || l.includes('liver')) {
      console.log(i + ': ' + JSON.stringify(lines[i]));
    }
  }
}

main().catch(console.error);

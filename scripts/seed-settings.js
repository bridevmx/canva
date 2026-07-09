const PB_URL = 'https://scraping.pockethost.io';
const COLLECTION = 'stiker_com_settings';
const DELAY_MS = 500;

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const records = require('../src/config/siteConfig.json');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function upload() {
  let ok = 0, fail = 0;

  for (const rec of records) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`${PB_URL}/api/collections/${COLLECTION}/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rec)
        });

        if (res.ok) {
          ok++;
          process.stdout.write('.');
          break;
        } else if (res.status === 429) {
          process.stdout.write('R');
          await sleep(2000);
          continue;
        } else {
          const text = await res.text();
          console.error(`\nFAIL [${rec.key}] (attempt ${attempt + 1}): ${res.status} ${text.slice(0, 80)}`);
          fail++;
          break;
        }
      } catch (e) {
        console.error(`\nERROR [${rec.key}] (attempt ${attempt + 1}): ${e.message}`);
        await sleep(1000);
        continue;
      }
    }
    await sleep(DELAY_MS);
  }

  console.log(`\n\nListo: ${ok} subidos, ${fail} fallidos de ${records.length} total`);
}

upload();

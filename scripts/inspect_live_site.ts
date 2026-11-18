import https from 'https';

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    });
  });
}

async function main() {
  const html = await fetchUrl('https://lankaproperty.lk/');
  console.log('HTML length:', html.length);
  const assetMatches = Array.from(html.matchAll(/\/assets\/[a-zA-Z0-9_\-\.]+\.js/g)).map((m) => m[0]);
  console.log('Assets found in HTML:', assetMatches);

  for (const asset of assetMatches) {
    const assetUrl = `https://lankaproperty.lk${asset}`;
    console.log(`\nFetching ${assetUrl}...`);
    const js = await fetchUrl(assetUrl);
    console.log(`Length: ${js.length}`);
    console.log('Has rnedttrpovxswnraezas:', js.includes('rnedttrpovxswnraezas'));
    console.log('Has xmvhnzuidwpwvdnyydio:', js.includes('xmvhnzuidwpwvdnyydio'));

    // Check imports inside js
    const subAssets = Array.from(js.matchAll(/['"](\.\/[a-zA-Z0-9_\-\.]+\.js)['"]/g)).map((m) => m[1]);
    for (const sub of subAssets) {
      const subUrl = `https://lankaproperty.lk/assets/${sub.replace('./', '')}`;
      console.log(`  Sub-asset: ${subUrl}`);
      const subJs = await fetchUrl(subUrl);
      console.log(`  Length: ${subJs.length}`);
      console.log('  Has rnedttrpovxswnraezas:', subJs.includes('rnedttrpovxswnraezas'));
      console.log('  Has xmvhnzuidwpwvdnyydio:', subJs.includes('xmvhnzuidwpwvdnyydio'));
      const foundSupabaseUrls = subJs.match(/https:\/\/[a-z0-9]+\.supabase\.co/g);
      if (foundSupabaseUrls) {
        console.log('  Found supabase URL:', foundSupabaseUrls);
      }
    }
  }
}

main();

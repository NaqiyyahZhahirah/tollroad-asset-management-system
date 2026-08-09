const fs = require('fs');
const path = require('path');
const { DOMParser } = require('@xmldom/xmldom');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

function parseKML(filePath, subRuas, jalur) {
  const xml = fs.readFileSync(filePath, 'utf-8');
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  const placemarks = doc.getElementsByTagName('Placemark');
  const records = [];

  for (let i = 0; i < placemarks.length; i++) {
    const pm = placemarks[i];
    const name = pm.getElementsByTagName('name')[0]?.textContent?.trim();
    const coordText = pm.getElementsByTagName('coordinates')[0]?.textContent?.trim();
    if (!name || !coordText) continue;

    const [lon, lat] = coordText.split(',').map(Number);

    const kmMatch = name.match(/(\d+)\+(\d+)/);
    const km = kmMatch ? parseFloat(kmMatch[1]) + parseFloat(kmMatch[2]) / 1000 : null;

    records.push({
      kategori: 'patok_heksa',
      ruas: 'Purbaleunyi',
      sub_ruas: subRuas,
      jalur,
      nama: `KM ${name}`,
      lokasi_km: km,
      koordinat_geojson: { type: 'Point', coordinates: [lon, lat] },
      latitude: lat,
      longitude: lon
    });
  }
  return records;
}

async function run() {
  const files = [
    { path: path.join(__dirname, 'kml/patok_heksa_MR_CPL_A.kml'), subRuas: 'Cipularang', jalur: 'A' },
    { path: path.join(__dirname, 'kml/patok_heksa_MR_CPL_B.kml'), subRuas: 'Cipularang', jalur: 'B' },
    { path: path.join(__dirname, 'kml/patok_heksa_MR_PDL_A.kml'), subRuas: 'Padaleunyi', jalur: 'A' },
    { path: path.join(__dirname, 'kml/patok_heksa_MR_PDL_B.kml'), subRuas: 'Padaleunyi', jalur: 'B' }
  ];

  let allRecords = [];
  for (const f of files) {
    if (!fs.existsSync(f.path)) {
      console.error(`File tidak ditemukan: ${f.path}`);
      continue;
    }
    const parsed = parseKML(f.path, f.subRuas, f.jalur);
    console.log(`${path.basename(f.path)}: ${parsed.length} titik`);
    allRecords = allRecords.concat(parsed);
  }

  console.log(`\nTotal ${allRecords.length} patok heksa akan diimport\n`);

  for (let i = 0; i < allRecords.length; i += 100) {
    const batch = allRecords.slice(i, i + 100);
    const { error } = await supabase.from('data_referensi_jalan').insert(batch);
    if (error) {
      console.error(`Batch ${i}-${i + batch.length} GAGAL:`, error.message);
    } else {
      console.log(`Batch ${i}-${i + batch.length} berhasil`);
    }
  }
}

run();
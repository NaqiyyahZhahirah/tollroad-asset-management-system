const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function run() {
  console.log('Mengambil data patok_heksa dari database...');
  const { data: patokHeksaList, error } = await supabase
    .from('data_referensi_jalan')
    .select('*')
    .eq('kategori', 'patok_heksa');

  if (error) {
    console.error('Gagal mengambil data:', error.message);
    return;
  }

  console.log(`Ditemukan ${patokHeksaList.length} titik patok heksa`);

  const groups = {};
  patokHeksaList.forEach((item) => {
    if (item.koordinat_geojson?.type !== 'Point') return;
    const key = `${item.sub_ruas || 'unknown'}__${item.jalur || 'unknown'}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });

  const records = [];
  Object.entries(groups).forEach(([key, points]) => {
    if (points.length < 2) return;

    const sorted = [...points].sort((a, b) => (a.lokasi_km ?? 0) - (b.lokasi_km ?? 0));
    const coordinates = sorted.map((p) => p.koordinat_geojson.coordinates);
    const [subRuas, jalur] = key.split('__');
    const kmMin = sorted[0].lokasi_km;
    const kmMax = sorted[sorted.length - 1].lokasi_km;

    records.push({
      kategori: 'main_road',
      ruas: 'Purbaleunyi',
      sub_ruas: subRuas,
      jalur: jalur === 'unknown' ? null : jalur,
      nama: `Main Road (Estimasi dari Patok Heksa) - ${subRuas} Jalur ${jalur}`,
      lokasi_km: null,
      koordinat_geojson: { type: 'LineString', coordinates },
      latitude: coordinates[0][1],
      longitude: coordinates[0][0]
    });

    console.log(`  ${subRuas} Jalur ${jalur}: ${points.length} titik, KM ${kmMin}-${kmMax}`);
  });

  if (records.length === 0) {
    console.log('Tidak ada data yang bisa digabungkan (butuh minimal 2 titik per sub_ruas+jalur).');
    return;
  }

  console.log(`\nMenyimpan ${records.length} garis Main Road ke database...`);
  const { error: insertError } = await supabase
    .from('data_referensi_jalan')
    .insert(records);

  if (insertError) {
    console.error('Gagal menyimpan:', insertError.message);
  } else {
    console.log('Berhasil! Main Road sudah tersimpan di database.');
  }
}

run();
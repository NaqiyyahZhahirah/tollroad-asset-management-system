const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const INPUT_BY_USER_ID = '18d74e90-2358-4efc-b8bf-fa2ccdc33800';

const JUMLAH_TITIK = 75;

function offsetCoord([lon, lat], meters, bearingDeg) {
    const bearing = bearingDeg * Math.PI / 180;
    const dLat = (meters * Math.cos(bearing)) / 111320;
    const dLon = (meters * Math.sin(bearing)) / (111320 * Math.cos(lat * Math.PI / 180));
    return [lon + dLon, lat + dLat];
}

function calculateBearing([lon1, lat1], [lon2, lat2]) {
    const toRad = (d) => d * Math.PI / 180;
    const toDeg = (r) => r * 180 / Math.PI;
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
        Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function haversineMeters([lon1, lat1], [lon2, lat2]) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatKm(km) {
    return Number.isInteger(km) ? km.toString() : Number(km.toFixed(2)).toString();
}

function randomDate(startYear, endYear) {
    const year = startYear + Math.floor(Math.random() * (endYear - startYear + 1));
    const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
    const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function randomKondisi() {
    const opsi = ['baik', 'baik', 'baik'];
    return opsi[Math.floor(Math.random() * opsi.length)];
}

function midpoint([lon1, lat1], [lon2, lat2]) {
    return [
        (lon1 + lon2) / 2,
        (lat1 + lat2) / 2
    ];
}

async function run() {
    console.log('Mengambil kategori aset...');
    const { data: kategoriList, error: kategoriErr } = await supabase
        .from('kategori_aset')
        .select('id, nama_kategori, versi_skema, tipe_geometri');
    if (kategoriErr) { console.error(kategoriErr); return; }

    const kategoriGuardrail = kategoriList.find((k) => k.nama_kategori === 'Guardrail');
    const kategoriRambu = kategoriList.find((k) => k.nama_kategori === 'Rambu');

    if (!kategoriGuardrail) { console.error('Kategori "Guardrail" tidak ditemukan.'); return; }
    if (!kategoriRambu) { console.error('Kategori "Rambu" tidak ditemukan.'); return; }

    console.log('Mengambil titik patok heksa...');
    const { data: patokList, error: patokErr } = await supabase
        .from('data_referensi_jalan')
        .select('*')
        .eq('kategori', 'patok_heksa')
        .order('lokasi_km', { ascending: true });
    if (patokErr) { console.error(patokErr); return; }
    if (!patokList || patokList.length < 2) {
        console.error('Data patok heksa tidak cukup untuk membentuk segmen.');
        return;
    }

    const jalurA = {};
    const jalurB = {};

    patokList.forEach((p) => {
        if (p.jalur === 'A') jalurA[p.lokasi_km] = p;
        if (p.jalur === 'B') jalurB[p.lokasi_km] = p;
    });

    const kmPairs = [];

    for (const km in jalurA) {
        if (jalurB[km]) {
            kmPairs.push({
                km: Number(km),
                a: jalurA[km],
                b: jalurB[km]
            });
        }
    }

    kmPairs.sort((a, b) => a.km - b.km);

    if (kmPairs.length < JUMLAH_TITIK) {
        console.error(
            `Pasangan KM tidak cukup (butuh ${JUMLAH_TITIK}, tersedia ${kmPairs.length})`
        );
        return;
    }

    const step = kmPairs.length / JUMLAH_TITIK;
    const selectedPairs = [];

    for (let i = 0; i < JUMLAH_TITIK; i++) {
        selectedPairs.push(
            kmPairs[Math.floor(i * step)]
        );
    }

    const records = [];

    for (const pair of selectedPairs) {
        const coordA = pair.a.koordinat_geojson.coordinates;
        const coordB = pair.b.koordinat_geojson.coordinates;

        const centerPoint = midpoint(coordA, coordB);

        records.push({
            kategori_id: kategoriRambu.id,
            versi_skema_saat_input: kategoriRambu.versi_skema,

            nama_aset: `Rambu KM ${formatKm(pair.km)}`,

            ruas_tol: 'Purbaleunyi',
            lokasi_km: pair.km,

            jalur: Math.random() < 0.5 ? 'A' : 'B',

            koordinat_geojson: {
                type: 'Point',
                coordinates: centerPoint
            },

            elevasi_mdpl: 650 + Math.round(Math.random() * 300),

            status_kondisi: randomKondisi(),

            atribut_spesifik: {
                jenis_tiang: 'Pipa Besi',
                jenis_panel_rambu: 'Alumunium',
                jenis_stiker_panel: 'HIP (High Intensity Prismatic)',
                jenis_stiker_tulisan: 'HIP (High Intensity Prismatic)'
            },

            tanggal_aset_dibuat: randomDate(2018, 2024),

            input_by: INPUT_BY_USER_ID,
            status_validasi: 'approved'
        });
    }

    console.log(`\nMenyimpan ${records.length} aset dummy ke database (${JUMLAH_TITIK} Rambu)...`);
    const { error: insertErr } = await supabase.from('aset_tol').insert(records);
    if (insertErr) {
        console.error('Gagal insert:', insertErr.message);
    } else {
        console.log('Berhasil! Aset dummy sudah tersimpan.');
    }
}

run();
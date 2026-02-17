const WilayahSync = require('./integration/wilayah_sync');

const sync = new WilayahSync();

const testCases = [
    {
        nama_desa: 'Madaraya',
        kecamatan: 'Pagelaran Utara',
        kabupaten: 'Pringsewu'
    },
    {
        nama_desa: 'Tulusrejo',
        kecamatan: 'Pekalongan',
        kabupaten: 'Lampung Timur'
    },
    {
        nama_desa: 'Bumi Daya',
        kecamatan: 'Palas',
        kabupaten: 'Lampung Selatan'
    },
    {
        nama_desa: 'Sidoraharjo', // Outside Lampung
        kecamatan: 'Krian',
        kabupaten: 'Sidoarjo'
    }
];

async function runTests() {
    console.log('=== Wilayah Sync Integration Test ===');

    // Wait for DB to load (it's synchronous but let's be safe)
    if (sync.vilData.length === 0) {
        console.log('Waiting for DB...');
        // Small delay to ensure fs read is done if it were async
    }

    testCases.forEach(test => {
        console.log(`\nTesting: ${test.nama_desa} (Kec: ${test.kecamatan}, Kab: ${test.kabupaten})`);
        const result = sync.matchVillage(test);
        if (result.matched) {
            console.log(`✅ Matched: ${result.nama_wilayah.desa}`);
            console.log(`   Kecamatan: ${result.nama_wilayah.kecamatan}`);
            console.log(`   Kabupaten: ${result.nama_wilayah.kabupaten}`);
            console.log(`   Confidence: ${result.confidence}%`);
            console.log(`   Code: ${result.kode_wilayah.desa}`);
        } else {
            console.log(`❌ Match Failed: ${result.reason}`);
        }
    });
}

runTests();

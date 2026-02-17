const axios = require('axios');
const CMSDetector = require('./engines/detector');
const VillageExtractor = require('./engines/extractor');

async function testSite(url) {
    console.log(`\nTesting: ${url}`);
    try {
        const detector = new CMSDetector(url);
        const results = await detector.detect();

        console.log(`CMS Detected: ${results.primary_cms ? results.primary_cms.name : 'None'} (Confidence: ${results.confidence}%)`);

        if (results.status_code === 200) {
            const response = await axios.get(url, { timeout: 10000 });
            const extractor = new VillageExtractor(response.data, url);
            const info = extractor.extractAll();

            console.log('Extracted Info:');
            console.log(`  Desa/Pekon: ${info.nama_desa}`);
            console.log(`  Kecamatan: ${info.kecamatan}`);
            console.log(`  Kabupaten: ${info.kabupaten}`);
            console.log(`  Provinsi: ${info.provinsi}`);
        } else {
            console.log(`Site status: ${results.status_code}`);
        }
    } catch (err) {
        console.error(`Error testing ${url}: ${err.message}`);
    }
}

async function runTests() {
    const sites = [
        'https://madaraya-pringsewu.desa.id',
        'https://tulusrejo.desa.id',
        'https://bumidaya.desa.id' // Note: This site might be down but we can check if it times out
    ];

    for (const site of sites) {
        await testSite(site);
    }
}

runTests();
